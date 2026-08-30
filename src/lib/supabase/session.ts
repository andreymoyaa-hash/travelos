import "server-only";

import { cookies } from "next/headers";

import type { CloudRole, TravelSession, TravelWorkspaceSession } from "@/types/cloud";
import { createTravelClient, createWorkspaceClient, TRAVEL_SESSION_COOKIE, WORKSPACE_CONTEXT_COOKIE, WORKSPACE_SESSION_COOKIE } from "@/lib/supabase/server";

const asRecord = (value: unknown): Record<string, boolean> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, enabled]) => [key, Boolean(enabled)]));
};

export async function readTravelSessionToken() {
  return (await cookies()).get(TRAVEL_SESSION_COOKIE)?.value;
}

export async function readWorkspaceSessionToken() {
  return (await cookies()).get(WORKSPACE_SESSION_COOKIE)?.value;
}

interface WorkspaceCookieContext {
  id: string;
  name: string;
  mapProvider: "google" | "open";
  profileName: string;
  expiresAt: string;
}

export function encodeWorkspaceContext(context: WorkspaceCookieContext) {
  return Buffer.from(JSON.stringify(context), "utf8").toString("base64url");
}

async function readWorkspaceContext(): Promise<WorkspaceCookieContext | undefined> {
  const value = (await cookies()).get(WORKSPACE_CONTEXT_COOKIE)?.value;
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as WorkspaceCookieContext;
    return parsed && typeof parsed.id === "string" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function getTravelSession(token?: string): Promise<TravelSession> {
  const sessionToken = token ?? await readTravelSessionToken();
  if (!sessionToken) throw new Error("UNAUTHENTICATED");
  const client = createTravelClient(sessionToken);

  const [tripResult, participantIdResult, roleResult, permissionsResult] = await Promise.all([
    client.from("trips").select("id,name,slug,map_provider").single(),
    client.schema("app").rpc("current_participant_id"),
    client.schema("app").rpc("current_role"),
    client.schema("app").rpc("current_permissions"),
  ]);
  if (tripResult.error || participantIdResult.error || !tripResult.data || !participantIdResult.data) throw new Error("INVALID_SESSION");

  const participantResult = await client.from("participants").select("id,display_name,role").eq("id", String(participantIdResult.data)).single();
  if (participantResult.error || !participantResult.data) throw new Error("INVALID_SESSION");

  return {
    accessKind: "trip",
    trip: { id: tripResult.data.id, name: tripResult.data.name, slug: tripResult.data.slug, mapProvider: tripResult.data.map_provider },
    participant: {
      id: participantResult.data.id,
      name: participantResult.data.display_name,
      role: (roleResult.data ?? participantResult.data.role) as CloudRole,
    },
    permissions: asRecord(permissionsResult.data),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

export async function getTravelWorkspaceSession(token?: string): Promise<TravelWorkspaceSession> {
  const sessionToken = token ?? await readWorkspaceSessionToken();
  if (!sessionToken) throw new Error("UNAUTHENTICATED");
  const client = createWorkspaceClient(sessionToken);
  const result = await client.schema("app").rpc("current_guest_workspace_id");
  if (result.error || typeof result.data !== "string") throw new Error("INVALID_WORKSPACE_SESSION");
  const context = await readWorkspaceContext();
  return {
    accessKind: "workspace",
    workspace: {
      id: result.data,
      name: context?.id === result.data ? context.name : "Espacio de viajes",
      mapProvider: context?.id === result.data ? context.mapProvider : "open",
    },
    profile: { name: context?.id === result.data ? context.profileName : "Invitado", role: "guest" },
    expiresAt: context?.id === result.data ? context.expiresAt : new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}
