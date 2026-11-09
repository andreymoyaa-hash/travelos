import { NextResponse } from "next/server";
import { getTravelSession, readTravelSessionToken } from "@/lib/supabase/session";
import { createTravelClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function context() {
  const token = await readTravelSessionToken();
  if (!token) throw new Error("NO_SESSION");
  const session = await getTravelSession(token);
  if (session.trip.slug !== "japan-2026") throw new Error("WRONG_TRIP");
  return { session, client: createTravelClient(token) };
}

function errorResponse(error: unknown) {
  const value = error instanceof Error ? error.message : "";
  return NextResponse.json({
    error: value === "NO_SESSION" || value === "INVALID_SESSION" ? "La sesión PIN expiró o no existe. Inicia sesión otra vez." :
      value === "WRONG_TRIP" ? "Este PIN corresponde a otro viaje." :
      value === "NO_PERMISSION" ? "Tu perfil no permite modificar los respaldos." :
      "No se pudo acceder al respaldo. " + (value.includes("permission denied") ? "Permiso rechazado." : "Comprueba la conexión."),
  }, { status: value === "NO_PERMISSION" || value === "WRONG_TRIP" ? 403 : value === "NO_SESSION" || value === "INVALID_SESSION" ? 401 : 502 });
}

function originAllowed(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host && (new URL(origin).protocol === "https:" || host.startsWith("localhost")); }
  catch { return false; }
}

export async function GET() {
  try {
    const { session, client } = await context();
    const result = await client.from("nioli_lite_pin_snapshots").select("itinerary,receipts,updated_at").eq("trip_id", session.trip.id).maybeSingle();
    if (result.error) throw result.error;
    return NextResponse.json({ snapshot: result.data ?? null, profile: session.participant.name, role: session.participant.role }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  try {
    const { session, client } = await context();
    if (session.participant.role !== "owner" && session.participant.role !== "editor") throw new Error("NO_PERMISSION");
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    const payload = body as Record<string, unknown>;
    if (!Array.isArray(payload.days) || !Array.isArray(payload.receipts) || payload.days.length > 50 || payload.receipts.length > 1000)
      return NextResponse.json({ error: "Datos inválidos o demasiado grandes." }, { status: 400 });
    if (!payload.days.every(day => day && typeof day === "object" && typeof day.date === "string" && Array.isArray(day.activities)))
      return NextResponse.json({ error: "El itinerario no tiene el formato correcto." }, { status: 400 });
    if (!payload.receipts.every(r => r && typeof r === "object" && typeof r.id === "string" && typeof r.title === "string" && typeof r.amount === "number" && Number.isFinite(r.amount) && r.amount >= 0))
      return NextResponse.json({ error: "Los gastos no tienen el formato correcto." }, { status: 400 });
    // Optimistic locking: a client must present the version it last inspected.
    // Prevent older phone tabs/devices from silently overwriting a newer backup.
    if (!(payload.expectedUpdatedAt === null || typeof payload.expectedUpdatedAt === "string")) {
      return NextResponse.json({ error: "Consulta primero el respaldo remoto antes de guardar." }, { status: 428 });
    }
    const expected = payload.expectedUpdatedAt;
    const changes = { itinerary: payload.days, receipts: payload.receipts, updated_at: new Date().toISOString() };
    if (typeof expected === "string") {
      const result = await client.from("nioli_lite_pin_snapshots")
        .update(changes).eq("trip_id", session.trip.id).eq("updated_at", expected)
        .select("updated_at").maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return NextResponse.json({ error: "El respaldo fue modificado desde otro dispositivo. Revisa las diferencias antes de guardar." }, { status: 409 });
      return NextResponse.json({ saved: true, updatedAt: result.data.updated_at }, { headers: { "Cache-Control": "no-store" } });
    }
    const result = await client.from("nioli_lite_pin_snapshots").insert({
      trip_id: session.trip.id, ...changes,
    }).select("updated_at").single();
    if (result.error?.code === "23505") return NextResponse.json({ error: "Ya existe un respaldo reciente. Vuelve a comprobar la nube." }, { status: 409 });
    if (result.error) throw result.error;
    return NextResponse.json({ saved: true, updatedAt: result.data.updated_at }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
