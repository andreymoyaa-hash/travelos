import { NextResponse } from "next/server";

import { createWorkspaceClient, TRAVEL_SESSION_COOKIE } from "@/lib/supabase/server";
import { getTravelSession, getTravelWorkspaceSession, readWorkspaceSessionToken } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

async function workspaceContext() {
  const token = await readWorkspaceSessionToken();
  if (!token) throw new Error("WORKSPACE_SESSION_REQUIRED");
  const workspace = await getTravelWorkspaceSession(token);
  return { token, workspace, client: createWorkspaceClient(token) };
}

export async function GET() {
  try {
    const { client } = await workspaceContext();
    const result = await client.schema("app").rpc("list_guest_workspace_trips");
    if (result.error) throw result.error;
    return NextResponse.json({
      trips: (result.data ?? []).map((row: { trip_id: string; trip_name: string; primary_country_code: string; start_date: string | null; end_date: string | null; map_provider: string }) => ({
        id: row.trip_id,
        name: row.trip_name,
        countryCode: row.primary_country_code,
        startDate: row.start_date ?? undefined,
        endDate: row.end_date ?? undefined,
        mapProvider: row.map_provider === "google" ? "google" : "open",
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo abrir el espacio." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    action?: "open" | "create";
    tripId?: string;
    name?: string;
    countryCode?: string;
    startDate?: string;
    endDate?: string;
    currency?: string;
    destinationTimeZone?: string;
  } | null;
  try {
    const { workspace, client } = await workspaceContext();
    let result;
    if (body?.action === "open" && /^[0-9a-f-]{36}$/i.test(body.tripId ?? "")) {
      result = await client.schema("app").rpc("open_guest_workspace_trip", { p_trip_id: body.tripId });
    } else if (body?.action === "create") {
      const name = body.name?.trim();
      const countryCode = body.countryCode?.trim().toUpperCase();
      if (!name || !countryCode || !/^[A-Z]{2}$/.test(countryCode)) {
        return NextResponse.json({ error: "Completa el nombre y el país del viaje." }, { status: 400 });
      }
      result = await client.schema("app").rpc("create_guest_workspace_trip", {
        p_name: name,
        p_primary_country_code: countryCode,
        p_start_date: body.startDate || null,
        p_end_date: body.endDate || null,
        p_primary_currency: body.currency?.trim().toUpperCase() || null,
        p_destination_timezone: body.destinationTimeZone?.trim() || null,
      });
    } else {
      return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
    }
    if (result.error || !result.data?.[0]?.session_token) throw result.error ?? new Error("No se pudo abrir el viaje.");
    const session = await getTravelSession(result.data[0].session_token);
    session.workspace = { id: workspace.workspace.id, name: workspace.workspace.name };
    const response = NextResponse.json(session);
    response.cookies.set(TRAVEL_SESSION_COOKIE, result.data[0].session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(session.expiresAt),
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo abrir el viaje." }, { status: 403 });
  }
}
