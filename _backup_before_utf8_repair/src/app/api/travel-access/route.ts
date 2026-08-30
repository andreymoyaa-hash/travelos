import { NextResponse } from "next/server";

import {
  canCreateTravelerSpaces,
  canManagePlatformAccess,
  canManageTripParticipants,
  tripPermissionsOnly,
} from "@/lib/permissions/permission-model";
import { createTravelClient } from "@/lib/supabase/server";
import { getTravelSession, readTravelSessionToken } from "@/lib/supabase/session";
import type { AccessParticipant, TravelSession } from "@/types/cloud";

export const dynamic = "force-dynamic";

async function accessContext() {
  const token = await readTravelSessionToken();
  if (!token) throw new Error("UNAUTHENTICATED");
  const session = await getTravelSession(token);
  return { session, client: createTravelClient(token) };
}

function requireTripParticipantManager(session: TravelSession) {
  if (!canManageTripParticipants(session.participant.role, session.permissions)) {
    throw new Error("TRIP_PARTICIPANT_PERMISSION_REQUIRED");
  }
}

function requirePlatformAccess(session: TravelSession, permission: "manage" | "create") {
  const allowed = permission === "manage"
    ? canManagePlatformAccess(session.permissions)
    : canCreateTravelerSpaces(session.permissions);
  if (!allowed) throw new Error("PLATFORM_PERMISSION_REQUIRED");
}

function statusForError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return 401;
  if (error instanceof Error && /required|invalid|too_long/i.test(error.message)) return 400;
  return 403;
}

function publicErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.message === "UNAUTHENTICATED") return "Inicia sesión para continuar.";
  if (error.message === "TRIP_PARTICIPANT_PERMISSION_REQUIRED") return "No tienes permiso para administrar acompañantes de este viaje.";
  if (error.message === "PLATFORM_PERMISSION_REQUIRED") return "Esta acción requiere autorización de Administrador de NIOLI.";
  if (error.message === "ACCESS_MANAGEMENT_PERMISSION_REQUIRED") return "No tienes permiso para administrar accesos.";
  if (/display_name_required/i.test(error.message)) return "Escribe el nombre de la persona.";
  if (/display_name_too_long/i.test(error.message)) return "El nombre es demasiado largo.";
  if (/invalid_access_expiry/i.test(error.message)) return "La fecha de vencimiento debe estar en el futuro.";
  return fallback;
}

function optionalDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new Error("invalid_access_expiry");
  return parsed.toISOString();
}

function setupUrl(request: Request, token: string) {
  const url = new URL("/setup", new URL(request.url).origin);
  url.hash = `token=${token}`;
  return url.toString();
}

function privateInvitationJson(body: object) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function firstRow<T>(data: unknown): T | undefined {
  return Array.isArray(data) ? data[0] as T | undefined : undefined;
}

export async function GET() {
  try {
    const { session, client } = await accessContext();
    const canManageTrip = canManageTripParticipants(session.participant.role, session.permissions);
    const canManagePlatform = canManagePlatformAccess(session.permissions);
    const canCreateTravelers = canCreateTravelerSpaces(session.permissions);
    if (!canManageTrip && !canManagePlatform && !canCreateTravelers) {
      throw new Error("ACCESS_MANAGEMENT_PERMISSION_REQUIRED");
    }

    let participants: AccessParticipant[] = [];
    if (canManageTrip) {
      const managedParticipants = await client.schema("app").rpc("list_trip_participants_for_management");
      if (managedParticipants.error) throw managedParticipants.error;
      participants = (managedParticipants.data ?? []).map((row: {
        participant_id: string;
        display_name: string;
        participant_role: AccessParticipant["role"];
        avatar_url: string | null;
        permissions: Record<string, boolean> | null;
        access_active: boolean;
      }) => ({
        id: row.participant_id,
        name: row.display_name,
        role: row.participant_role,
        avatarUrl: row.avatar_url ?? undefined,
        permissions: row.permissions ?? {},
        accessActive: row.access_active,
      }));
    }

    let workspaces: Array<{
      id: string;
      displayName: string;
      active: boolean;
      expiresAt?: string;
      createdAt: string;
    }> = [];
    if (canManagePlatform) {
      const result = await client.schema("app").rpc("list_guest_workspace_accesses");
      if (result.error) throw result.error;
      workspaces = (result.data ?? []).map((row: {
        workspace_id: string;
        display_name: string;
        is_active: boolean;
        expires_at: string | null;
        created_at: string;
      }) => ({
        id: row.workspace_id,
        displayName: row.display_name,
        active: row.is_active,
        expiresAt: row.expires_at ?? undefined,
        createdAt: row.created_at,
      }));
    }

    return NextResponse.json({ participants, workspaces });
  } catch (error) {
    return NextResponse.json(
      { error: publicErrorMessage(error, "No se pudieron cargar los accesos.") },
      { status: statusForError(error) },
    );
  }
}

interface AccessRequestBody {
  action?: string;
  participantId?: string;
  workspaceId?: string;
  name?: string;
  permissions?: Record<string, boolean>;
  accessExpiresAt?: string;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as AccessRequestBody | null;
  try {
    const { session, client } = await accessContext();

    if (body?.action === "createTravelerInvitation") {
      requirePlatformAccess(session, "create");
      const result = await client.schema("app").rpc("issue_independent_traveler_invitation", {
        p_display_name: body.name?.trim(),
        p_access_expires_at: optionalDate(body.accessExpiresAt),
      });
      if (result.error) throw result.error;
      const row = firstRow<{ setup_token?: string; setup_expires_at?: string }>(result.data);
      if (!row?.setup_token) throw new Error("INVITATION_RESPONSE_INVALID");
      return privateInvitationJson({
        invitation: {
          type: "independent_traveler",
          setupUrl: setupUrl(request, row.setup_token),
          setupExpiresAt: row.setup_expires_at,
          targetName: body.name?.trim(),
          inviterName: session.participant.name,
        },
        message: "Invitación lista. Comparte el enlace para que esta persona elija su PIN.",
      });
    }

    if (body?.action === "createCompanionInvitation") {
      requireTripParticipantManager(session);
      const result = await client.schema("app").rpc("issue_trip_companion_invitation", {
        p_display_name: body.name?.trim(),
        p_permissions: tripPermissionsOnly(body.permissions),
        p_access_expires_at: optionalDate(body.accessExpiresAt),
      });
      if (result.error) throw result.error;
      const row = firstRow<{ setup_token?: string; setup_expires_at?: string }>(result.data);
      if (!row?.setup_token) throw new Error("INVITATION_RESPONSE_INVALID");
      return privateInvitationJson({
        invitation: {
          type: "trip_companion",
          setupUrl: setupUrl(request, row.setup_token),
          setupExpiresAt: row.setup_expires_at,
          targetName: body.name?.trim(),
          inviterName: session.participant.name,
          tripName: session.trip.name,
        },
        message: "Invitación lista. Comparte el enlace para que esta persona elija su PIN.",
      });
    }

    if (body?.action === "resetCompanionPin" && body.participantId) {
      requireTripParticipantManager(session);
      const result = await client.schema("app").rpc("issue_trip_companion_pin_reset", {
        p_participant_id: body.participantId,
      });
      if (result.error) throw result.error;
      const row = firstRow<{ setup_token?: string; setup_expires_at?: string }>(result.data);
      if (!row?.setup_token) throw new Error("INVITATION_RESPONSE_INVALID");
      return privateInvitationJson({
        invitation: {
          type: "trip_companion",
          setupUrl: setupUrl(request, row.setup_token),
          setupExpiresAt: row.setup_expires_at,
          targetName: body.name?.trim(),
          inviterName: session.participant.name,
          tripName: session.trip.name,
        },
        message: "Enlace de recuperación listo. Las sesiones anteriores fueron cerradas.",
      });
    }

    if (body?.action === "resetTravelerPin" && body.workspaceId) {
      requirePlatformAccess(session, "manage");
      const result = await client.schema("app").rpc("issue_independent_traveler_pin_reset", {
        p_workspace_id: body.workspaceId,
      });
      if (result.error) throw result.error;
      const row = firstRow<{ setup_token?: string; setup_expires_at?: string }>(result.data);
      if (!row?.setup_token) throw new Error("INVITATION_RESPONSE_INVALID");
      return privateInvitationJson({
        invitation: {
          type: "independent_traveler",
          setupUrl: setupUrl(request, row.setup_token),
          setupExpiresAt: row.setup_expires_at,
          targetName: body.name?.trim(),
          inviterName: session.participant.name,
        },
        message: "Enlace de recuperación listo. Las sesiones anteriores fueron cerradas.",
      });
    }

    if (body?.action === "updateTripPermissions" && body.participantId) {
      requireTripParticipantManager(session);
      const result = await client.schema("app").rpc("set_trip_participant_permissions", {
        p_participant_id: body.participantId,
        p_permissions: tripPermissionsOnly(body.permissions),
      });
      if (result.error) throw result.error;
      return NextResponse.json({ updated: true, message: "Permisos del viaje actualizados." });
    }

    if (body?.action === "revokeTripAccess" && body.participantId) {
      requireTripParticipantManager(session);
      const result = await client.schema("app").rpc("revoke_trip_participant_access", {
        p_participant_id: body.participantId,
      });
      if (result.error) throw result.error;
      return NextResponse.json({ revoked: true, message: "Acceso a este viaje revocado." });
    }

    if (body?.action === "revokeTravelerAccess" && body.workspaceId) {
      requirePlatformAccess(session, "manage");
      const result = await client.schema("app").rpc("revoke_guest_workspace_access", {
        p_workspace_id: body.workspaceId,
      });
      if (result.error) throw result.error;
      return NextResponse.json({ revoked: true, message: "Acceso independiente revocado." });
    }

    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: publicErrorMessage(error, "No se pudo actualizar el acceso.") },
      { status: statusForError(error) },
    );
  }
}
