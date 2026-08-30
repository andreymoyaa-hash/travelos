import { NextResponse } from "next/server";

import { createTravelClient } from "@/lib/supabase/server";
import { getTravelSession, readTravelSessionToken } from "@/lib/supabase/session";
import { stableUuid } from "@/lib/supabase/travel-cloud";
import type { TravelPhoto } from "@/types/travel";

export const dynamic = "force-dynamic";

const imagePattern = /^data:(image\/(?:jpeg|png|webp|heic));base64,([A-Za-z0-9+/=]+)$/;

export async function POST(request: Request) {
  const token = await readTravelSessionToken();
  if (!token) return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  const body = await request.json().catch(() => null) as { photo?: TravelPhoto } | null;
  const match = body?.photo?.dataUrl.match(imagePattern);
  if (!body?.photo || !match) return NextResponse.json({ error: "La foto no es válida." }, { status: 400 });
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 15 * 1024 * 1024) return NextResponse.json({ error: "La foto supera el límite de 15 MB." }, { status: 400 });

  try {
    const session = await getTravelSession(token);
    const client = createTravelClient(token);
    const extension = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : match[1] === "image/heic" ? "heic" : "jpg";
    const photoId = stableUuid(session.trip.id, "photo", body.photo.id);
    const path = `${session.trip.id}/${session.participant.id}/${photoId}.${extension}`;
    const uploaded = await client.storage.from("travel-photos").upload(path, bytes, { contentType: match[1], upsert: false });
    if (uploaded.error && !uploaded.error.message.toLocaleLowerCase().includes("already exists")) throw uploaded.error;
    const createdObject = !uploaded.error;

    const activityId = body.photo.activityId ? stableUuid(session.trip.id, "activity", body.photo.activityId) : null;
    const stampId = body.photo.achievementId ? stableUuid(session.trip.id, "stamp", body.photo.achievementId) : null;
    let locationId: string | null = null;
    if (body.photo.locationId) {
      const locations = await client.from("locations").select("id,stable_key");
      if (locations.error) throw locations.error;
      const requestedKeys = new Set([body.photo.locationId, `saved:${body.photo.locationId}`]);
      locationId = locations.data?.find((location) => requestedKeys.has(location.stable_key))?.id ?? null;
    }
    const inserted = await client.from("photos").upsert({
      id: photoId, trip_id: session.trip.id, participant_id: session.participant.id,
      activity_id: activityId, location_id: locationId, stamp_id: stampId, storage_path: path,
      note: body.photo.note ?? null, taken_at: body.photo.createdAt,
    }, { onConflict: "id" });
    if (inserted.error) {
      if (createdObject) await client.storage.from("travel-photos").remove([path]);
      throw inserted.error;
    }
    const signed = await client.storage.from("travel-photos").createSignedUrl(path, 60 * 60);
    if (signed.error) throw signed.error;
    return NextResponse.json({ photo: { ...body.photo, tripId: session.trip.id, participantId: session.participant.id, dataUrl: signed.data.signedUrl, storagePath: path } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar la foto." }, { status: 502 });
  }
}
