import { NextResponse } from "next/server";

import { migrateJapanIfNeeded } from "@/lib/supabase/travel-cloud";
import { readTravelSessionToken } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = await readTravelSessionToken();
  if (!token) return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  try {
    return NextResponse.json(await migrateJapanIfNeeded(token));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo migrar Japón 2026." }, { status: 502 });
  }
}
