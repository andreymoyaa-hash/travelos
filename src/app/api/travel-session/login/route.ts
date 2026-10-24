import { NextResponse } from "next/server";

import { callPinLogin, TRAVEL_SESSION_COOKIE, WORKSPACE_CONTEXT_COOKIE, WORKSPACE_SESSION_COOKIE } from "@/lib/supabase/server";
import { encodeWorkspaceContext } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { pin?: unknown } | null;
  if (!body || typeof body.pin !== "string" || !/^\d{6}$/.test(body.pin)) {
    return NextResponse.json({ error: "El PIN debe tener 6 dígitos." }, { status: 400 });
  }

  try {
    const { response, payload } = await callPinLogin(body.pin);
    if (!response.ok || typeof payload.sessionToken !== "string") {
      const status = response.status === 429 ? 429 : response.status === 401 ? 401 : 502;
      return NextResponse.json({ error: status === 429 ? "Demasiados intentos. Intenta más tarde." : status === 401 ? "PIN incorrecto." : "No se pudo iniciar sesión." }, { status });
    }

    const expiresAt = typeof payload.expiresAt === "string" ? payload.expiresAt : new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    } as const;

    if (payload.accessKind === "workspace" && payload.workspace && typeof payload.workspace === "object") {
      const workspace = payload.workspace as { id?: unknown; name?: unknown; mapProvider?: unknown };
      const profile = payload.profile && typeof payload.profile === "object" ? payload.profile as { name?: unknown } : {};
      if (typeof workspace.id !== "string") return NextResponse.json({ error: "No se pudo abrir el espacio de viajes." }, { status: 502 });
      const session = {
        accessKind: "workspace" as const,
        workspace: {
          id: workspace.id,
          name: typeof workspace.name === "string" ? workspace.name : "Espacio de viajes",
          mapProvider: workspace.mapProvider === "google" ? "google" as const : "open" as const,
        },
        profile: { name: typeof profile.name === "string" ? profile.name : "Invitado", role: "guest" as const },
        expiresAt,
      };
      const result = NextResponse.json(session);
      result.cookies.set(WORKSPACE_SESSION_COOKIE, payload.sessionToken, cookieOptions);
      result.cookies.set(WORKSPACE_CONTEXT_COOKIE, encodeWorkspaceContext({ id: session.workspace.id, name: session.workspace.name, mapProvider: session.workspace.mapProvider, profileName: session.profile.name, expiresAt }), cookieOptions);
      result.cookies.set(TRAVEL_SESSION_COOKIE, "", { ...cookieOptions, expires: undefined, maxAge: 0 });
      return result;
    }

    const trip = payload.trip && typeof payload.trip === "object"
      ? payload.trip as { id?: unknown; name?: unknown; slug?: unknown; mapProvider?: unknown }
      : {};
    const participant = payload.participant && typeof payload.participant === "object"
      ? payload.participant as { id?: unknown; name?: unknown; role?: unknown }
      : {};
    if (typeof trip.id !== "string" || typeof trip.name !== "string" || typeof participant.id !== "string" || typeof participant.name !== "string") {
      return NextResponse.json({ error: "No se pudo abrir la sesión del viaje." }, { status: 502 });
    }
    const session = {
      accessKind: "trip" as const,
      trip: {
        id: trip.id,
        name: trip.name,
        slug: typeof trip.slug === "string" ? trip.slug : undefined,
        mapProvider: trip.mapProvider === "google" ? "google" as const : "open" as const,
      },
      participant: {
        id: participant.id,
        name: participant.name,
        role: participant.role === "owner" || participant.role === "editor" || participant.role === "participant" || participant.role === "viewer" ? participant.role : "participant",
      },
      permissions: payload.permissions && typeof payload.permissions === "object" && !Array.isArray(payload.permissions) ? payload.permissions : {},
      expiresAt,
    };
    const result = NextResponse.json(session);
    result.cookies.set(TRAVEL_SESSION_COOKIE, payload.sessionToken, cookieOptions);
    result.cookies.set(WORKSPACE_SESSION_COOKIE, "", { ...cookieOptions, expires: undefined, maxAge: 0 });
    result.cookies.set(WORKSPACE_CONTEXT_COOKIE, "", { ...cookieOptions, expires: undefined, maxAge: 0 });
    return result;
  } catch {
    return NextResponse.json({ error: "Supabase no está disponible." }, { status: 503 });
  }
}
