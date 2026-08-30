import { NextResponse } from "next/server";

import { loadAuthorizedTrip, syncAuthorizedTrip } from "@/lib/supabase/travel-cloud";
import { readTravelSessionToken } from "@/lib/supabase/session";
import type { Trip } from "@/types/travel";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await readTravelSessionToken();
  if (!token) return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  try {
    return NextResponse.json(await loadAuthorizedTrip(token));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloud Mode no disponible.";
    return NextResponse.json({ error: message }, { status: message.includes("SESSION") ? 401 : 502 });
  }
}

export async function POST(request: Request) {
  const token = await readTravelSessionToken();
  if (!token) return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  const body = await request.json().catch(() => null) as { trip?: Trip } | null;
  if (!body?.trip || typeof body.trip !== "object") return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  try {
    const session = await syncAuthorizedTrip(token, body.trip);
    return NextResponse.json({ saved: true, tripId: session.trip.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron guardar los cambios." }, { status: 502 });
  }
}
