import { NextResponse } from "next/server";
import { getTravelSession, readTravelSessionToken } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const token = await readTravelSessionToken();
    if (!token) return NextResponse.json({ error: "Inicia sesión con tu PIN." }, { status: 401 });
    const session = await getTravelSession(token);
    if (session.trip.slug !== "japan-2026") return NextResponse.json({ error: "Viaje no autorizado." }, { status: 403 });
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) throw Error("Tipo de cambio no disponible.");
    const data = await response.json() as {
      result?: string; rates?: Record<string, number>; time_last_update_utc?: string;
    };
    const jpy = data.rates?.JPY;
    const crc = data.rates?.CRC;
    if (data.result !== "success" || typeof jpy !== "number" || !Number.isFinite(jpy) || jpy <= 0 ||
        typeof crc !== "number" || !Number.isFinite(crc) || crc <= 0) throw Error("Tasas no disponibles.");
    return NextResponse.json({
      perUSD: { USD: 1, JPY: jpy, CRC: crc },
      asOf: data.time_last_update_utc || null,
      source: "ExchangeRate-API Open Access",
      approximate: true,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "No fue posible obtener tipos de cambio actualizados." }, { status: 503 });
  }
}
