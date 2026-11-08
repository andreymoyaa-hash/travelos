import { NextRequest, NextResponse } from "next/server";
import { getTravelSession, readTravelSessionToken } from "@/lib/supabase/session";
import { createTravelClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BUCKET = "nioli-lite-pin-receipts";
const ALLOWED = new Set(["image/jpeg","image/png","image/webp"]);
function validId(id: string | null) { return Boolean(id && /^receipt-[a-zA-Z0-9_-]{6,80}$/.test(id)); }
function checkOrigin(request: Request) {
  const origin = request.headers.get("origin"), host = request.headers.get("host");
  try { return !!origin && !!host && new URL(origin).host === host && (new URL(origin).protocol === "https:" || host.startsWith("localhost")); }
  catch { return false; }
}
async function context() {
  const token = await readTravelSessionToken();
  if (!token) throw new Error("NO_SESSION");
  const session = await getTravelSession(token);
  if (session.trip.slug !== "japan-2026") throw new Error("WRONG_TRIP");
  return { session, client: createTravelClient(token) };
}
function failure(error: unknown) {
  const name = error instanceof Error ? error.message : "ERROR";
  return NextResponse.json({ error: name === "NO_SESSION" || name === "INVALID_SESSION" ? "Inicia sesión con PIN." : name === "NO_PERMISSION" ? "Este PIN no permite subir fotos." : "No se pudo acceder a la fotografía." }, { status: name === "NO_SESSION" || name === "INVALID_SESSION" ? 401 : name === "NO_PERMISSION" || name === "WRONG_TRIP" ? 403 : 502 });
}
function filePath(tripId: string, id: string) { return tripId + "/" + id + ".jpg"; }

export async function POST(request: NextRequest) {
  if (!checkOrigin(request)) return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  try {
    const { client, session } = await context();
    if (!["owner","editor"].includes(session.participant.role)) throw new Error("NO_PERMISSION");
    const form = await request.formData();
    const id = form.get("id");
    const value = form.get("photo");
    if (typeof id !== "string" || !validId(id) || !(value instanceof File) || !ALLOWED.has(value.type) || value.size > 10_000_000 || value.size === 0)
      return NextResponse.json({ error: "Foto inválida. Usa JPG, PNG o WebP de hasta 10 MB." }, { status: 400 });
    const upload = await client.storage.from(BUCKET).upload(filePath(session.trip.id, id), value, { contentType: value.type, upsert: true });
    if (upload.error) throw upload.error;
    return NextResponse.json({ saved: true });
  } catch (error) { return failure(error); }
}
export async function GET(request: NextRequest) {
  try {
    const { client, session } = await context();
    const id = request.nextUrl.searchParams.get("id");
    if (!validId(id)) return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    const result = await client.storage.from(BUCKET).download(filePath(session.trip.id, id!));
    if (result.error || !result.data) return NextResponse.json({ error: "Foto no encontrada." }, { status: 404 });
    const bytes = await result.data.arrayBuffer();
    return new NextResponse(bytes, { headers: { "Content-Type": result.data.type || "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return failure(error); }
}
