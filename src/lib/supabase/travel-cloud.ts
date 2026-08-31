import "server-only";

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { countryThemeById } from "@/data/countries";
import { japan2026Trip } from "@/data/trips/japan-2026";
import { createEmptyTrip } from "@/repositories/trip-repository";
import type { CloudTripPayload, TravelSession } from "@/types/cloud";
import type { Achievement, Activity, CountryId, Currency, Expense, Participant, Reservation, TravelPhoto, Trip, TripDay, TripDayType, TripLocation } from "@/types/travel";
import { createTravelClient } from "@/lib/supabase/server";
import { getTravelSession } from "@/lib/supabase/session";

const NOTE_PREFIX = "travelos:v1:";
const participantColors = ["#6f56b7", "#df5753", "#0c8f69", "#d97732", "#2d6685", "#b15a73"];
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const initialsFor = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VJ";
const participantKey = (name: string) => name.trim().normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");

type NotePayload = Record<string, unknown> & { note?: string };

function encodeNote(note: string | undefined, extra: Record<string, unknown> = {}) {
  return `${NOTE_PREFIX}${JSON.stringify({ ...extra, note: note || undefined })}`;
}

function decodeNote(value: unknown): NotePayload {
  if (typeof value !== "string") return {};
  if (!value.startsWith(NOTE_PREFIX)) return { note: value };
  try {
    const parsed = JSON.parse(value.slice(NOTE_PREFIX.length));
    return parsed && typeof parsed === "object" ? parsed as NotePayload : {};
  } catch {
    return { note: value };
  }
}

export function stableUuid(tripId: string, kind: string, stableKey: string) {
  const hex = createHash("sha256").update(`${tripId}:${kind}:${stableKey}`).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 3) | 8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function remotePhotoId(tripId: string, clientPhotoId: string) {
  const loadedPhoto = /^photo-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.exec(clientPhotoId);
  return loadedPhoto?.[1] ?? stableUuid(tripId, "photo", clientPhotoId);
}

function countryIdFor(code: string): CountryId {
  if (code === "JP") return "japan";
  if (code === "MX") return "mexico";
  if (code === "CO") return "colombia";
  if (code === "KR") return "korea";
  if (code === "US") return "usa";
  if (code === "ES") return "spain";
  if (code === "CL") return "chile";
  if (code === "AR") return "argentina";
  if (code === "CR") return "costa-rica";
  return "other";
}

function currencyFor(value: string | null | undefined): Currency {
  return (["JPY", "CRC", "USD", "MXN", "EUR", "COP", "CLP", "ARS", "KRW"] as const).includes(value as Currency) ? value as Currency : "USD";
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${formatter.format(new Date(`${startDate}T12:00:00Z`))} — ${formatter.format(new Date(`${endDate}T12:00:00Z`))}`;
}

function dateLabels(date: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  return {
    weekday: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][parsed.getUTCDay()],
    dayNumber: date.slice(-2),
    month: ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"][parsed.getUTCMonth()],
  };
}

function assertResult(result: { error: { message: string } | null }, label: string) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
}

function extensionSnapshot(trip: Trip) {
  return {
    kind: "travel_os_app_state",
    version: 1,
    currentCity: trip.currentCity,
    route: trip.route,
    bases: trip.bases,
    flightSegments: trip.flightSegments,
    budget: trip.budget,
    worldClock: trip.worldClock,
    routeOptions: trip.routeOptions,
    settings: trip.settings,
  };
}

async function ensureMigrationParticipants(client: SupabaseClient, session: TravelSession, source: Trip) {
  const existingResult = await client.from("participants").select("id,display_name,role,avatar_url");
  assertResult(existingResult, "participants");
  const existing = existingResult.data ?? [];
  for (const participant of source.participants) {
    if (existing.some((row) => participantKey(row.display_name) === participantKey(participant.name))) continue;
    const result = await client.from("participants").insert({
      id: stableUuid(session.trip.id, "participant", participant.id),
      trip_id: session.trip.id,
      display_name: participant.name,
      role: "participant",
      avatar_url: participant.avatarUrl ?? null,
    });
    assertResult(result, `participant ${participant.name}`);
  }
}

async function removeMissingPlannedRows(client: SupabaseClient, tripId: string, table: string, stableKeys: string[]) {
  const existing = await client.from(table).select("id,stable_key").eq("trip_id", tripId);
  assertResult(existing, `read ${table}`);
  const keep = new Set(stableKeys);
  const ids = (existing.data ?? []).filter((row) => !keep.has(row.stable_key)).map((row) => row.id);
  if (!ids.length) return;
  const deleted = await client.from(table).delete().in("id", ids);
  assertResult(deleted, `delete ${table}`);
}

export async function syncAuthorizedTrip(token: string, source: Trip, options: { migration?: boolean } = {}) {
  const session = await getTravelSession(token);
  const client = createTravelClient(token);
  if (options.migration) {
    if (session.participant.role !== "owner" || session.trip.slug !== "japan-2026") throw new Error("MIGRATION_NOT_ALLOWED");
    await ensureMigrationParticipants(client, session, source);
  }

  const participantResult = await client.from("participants").select("id,display_name,role");
  assertResult(participantResult, "participants");
  const participants = participantResult.data ?? [];
  const participantByLocalId = new Map<string, string>();
  for (const local of source.participants) {
    const remote = participants.find((item) => item.display_name.toLocaleLowerCase() === local.name.toLocaleLowerCase());
    if (remote) participantByLocalId.set(local.id, remote.id);
  }
  const isOwner = session.participant.role === "owner";
  const canEditPlan = isOwner || Boolean(session.permissions.edit_itinerary);
  const canManageReservations = isOwner || Boolean(session.permissions.manage_reservations);
  const canCreateStamps = canEditPlan || Boolean(session.permissions.create_stamps);

  const country = countryThemeById[source.countryId] ?? countryThemeById.other;
  if (isOwner) {
    const tripUpdate = await client.from("trips").update({
      name: source.name,
      primary_country_code: country.countryCode,
      country_codes: [country.countryCode],
      start_date: source.startDate,
      end_date: source.endDate,
      primary_currency: source.budget.currency,
      origin_timezone: source.timezones.origin,
      destination_timezone: source.timezones.destination,
      map_provider: source.settings?.mapProvider ?? "google",
    }).eq("id", session.trip.id);
    assertResult(tripUpdate, "trip");

    const extension = extensionSnapshot(source);
    const extensionJson = JSON.stringify(extension);
    const importResult = await client.from("trip_imports").upsert({
      id: stableUuid(session.trip.id, "import", "travel-os-app-state"),
      trip_id: session.trip.id,
      standard_version: "travel-os-app-state-v1",
      document_version: "1",
      file_name: "travel-os-app-state.json",
      checksum: createHash("sha256").update(extensionJson).digest("hex"),
      imported_by: session.participant.id,
      changes_applied: extension,
    }, { onConflict: "id" });
    assertResult(importResult, "trip extension");
  }

  const locationRows: Array<Record<string, unknown>> = [];
  const locationIdByActivity = new Map<string, string>();
  for (const place of source.savedPlaces) {
    const stableKey = `saved:${place.id ?? place.placeId ?? stableUuid(session.trip.id, "saved", `${place.name}:${place.address}`)}`;
    locationRows.push({
      id: stableUuid(session.trip.id, "location", stableKey), trip_id: session.trip.id, stable_key: stableKey,
      name: place.name, address: place.address, place_id: place.placeId, latitude: place.latitude, longitude: place.longitude,
      country_code: country.countryCode, city: source.currentCity,
    });
  }
  for (const day of source.itinerary) for (const activity of day.activities) {
    const stableKey = `activity:${activity.id}`;
    const id = stableUuid(session.trip.id, "location", stableKey);
    locationIdByActivity.set(activity.id, id);
    locationRows.push({
      id, trip_id: session.trip.id, stable_key: stableKey, name: activity.location.name || activity.title,
      address: activity.location.address, place_id: activity.location.placeId, latitude: activity.location.latitude,
      longitude: activity.location.longitude, country_code: country.countryCode, city: activity.city ?? day.city,
    });
  }
  if (canEditPlan && locationRows.length) assertResult(await client.from("locations").upsert(locationRows, { onConflict: "trip_id,stable_key" }), "locations");

  const dayRows = source.itinerary.map((day) => ({
    id: stableUuid(session.trip.id, "day", day.id), trip_id: session.trip.id, stable_key: day.id, day_date: day.date,
    country_code: country.countryCode, city: day.city, base_name: day.baseId ?? null, title: day.area,
    notes: encodeNote(day.notes, { visitedCity: day.visitedCity, previousBaseId: day.previousBaseId, dayType: day.dayType, weather: day.weather, hiddenGem: day.hiddenGem, flexible: day.flexible }),
  }));
  if (canEditPlan && dayRows.length) assertResult(await client.from("trip_days").upsert(dayRows, { onConflict: "trip_id,stable_key" }), "trip days");

  const reservationRows = source.reservations.map((reservation) => ({
    id: stableUuid(session.trip.id, "reservation", reservation.id), trip_id: session.trip.id, stable_key: reservation.id,
    reservation_type: reservation.type, name: reservation.title, reservation_date: reservation.dateISO ?? source.startDate,
    reservation_time: reservation.time && /^\d{2}:\d{2}/.test(reservation.time) ? reservation.time.slice(0, 5) : null,
    confirmation: reservation.code || null, price: null, currency: null,
    notes: encodeNote(undefined, { provider: reservation.provider, subtitle: reservation.subtitle, displayDate: reservation.date, time: reservation.time, status: reservation.status, accent: reservation.accent, meta: reservation.meta, documentIds: reservation.documentIds, qrCode: reservation.qrCode }),
  }));
  if (canManageReservations && reservationRows.length) assertResult(await client.from("reservations").upsert(reservationRows, { onConflict: "trip_id,stable_key" }), "reservations");

  const stampRows = source.achievements.map((stamp) => ({
    id: stableUuid(session.trip.id, "stamp", stamp.id), trip_id: session.trip.id, stable_key: stamp.id,
    country_code: country.countryCode, city: stamp.city ?? stamp.location, name: stamp.title, category: stamp.category,
    description: stamp.description, unlock_condition: encodeNote(undefined, { icon: stamp.icon, color: stamp.color, unlockMethods: stamp.unlockMethods, geoTriggers: stamp.geoTriggers, location: stamp.location, custom: stamp.custom }),
    gps_recommended: stamp.unlockMethods.includes("gps"), photo_recommended: stamp.unlockMethods.includes("photo"), rarity: stamp.rarity ?? "common",
    source: stamp.custom ? "custom" : "country_experience",
  }));
  if (canCreateStamps && stampRows.length) assertResult(await client.from("passport_stamps").upsert(stampRows, { onConflict: "trip_id,stable_key" }), "passport stamps");

  const activityRows = source.itinerary.flatMap((day) => day.activities.map((activity, orderIndex) => ({
    id: stableUuid(session.trip.id, "activity", activity.id), trip_id: session.trip.id,
    trip_day_id: stableUuid(session.trip.id, "day", day.id), stable_key: activity.id,
    activity_time: activity.startTime && /^\d{2}:\d{2}/.test(activity.startTime) ? activity.startTime.slice(0, 5) : null,
    name: activity.title, category: activity.category, location_id: locationIdByActivity.get(activity.id) ?? null,
    reservation_id: activity.reservationId ? stableUuid(session.trip.id, "reservation", activity.reservationId) : null,
    cost: activity.estimatedCost ?? null, currency: activity.currency ?? null,
    notes: encodeNote(activity.notes, { categories: activity.categories, endTime: activity.endTime, city: activity.city, optional: activity.optional, flightSegmentId: activity.flightSegmentId, stampId: activity.stampId }),
    hidden_gem: Boolean(activity.hiddenGem), passport_eligible: Boolean(activity.stampId), completed: Boolean(activity.completed), order_index: orderIndex,
  })));
  if (canEditPlan && activityRows.length) assertResult(await client.from("activities").upsert(activityRows, { onConflict: "trip_id,stable_key" }), "activities");

  const expenseRows = source.expenses.map((expense) => ({
    id: stableUuid(session.trip.id, "expense", expense.id), trip_id: session.trip.id,
    participant_id: isOwner ? participantByLocalId.get(expense.paidBy) ?? session.participant.id : session.participant.id,
    expense_date: expense.date, amount: expense.amount, currency: expense.currency, category: expense.category,
    is_shared: expense.scope === "shared", note: encodeNote(undefined, { originalId: expense.id, title: expense.title, icon: expense.icon, splitBetween: expense.splitBetween }),
  }));
  if (expenseRows.length) assertResult(await client.from("expenses").upsert(expenseRows, { onConflict: "id" }), "expenses");

  const unlockRows = source.achievements.flatMap((stamp) => stamp.unlockedBy.flatMap((participantId) => {
    const remoteParticipantId = participantByLocalId.get(participantId) ?? (participantId === session.participant.id ? participantId : undefined);
    if (!remoteParticipantId || (!isOwner && remoteParticipantId !== session.participant.id)) return [];
    const stampId = stableUuid(session.trip.id, "stamp", stamp.id);
    return [{
      id: stableUuid(session.trip.id, "unlock", `${stamp.id}:${remoteParticipantId}`), trip_id: session.trip.id,
      stamp_id: stampId, participant_id: remoteParticipantId,
      photo_id: stamp.unlockedPhotoIds?.[participantId] ? remotePhotoId(session.trip.id, stamp.unlockedPhotoIds[participantId]) : null,
      unlocked_at: stamp.unlockedAt?.[participantId] ?? new Date().toISOString(), validation_method: "manual",
    }];
  }));
  if (unlockRows.length) assertResult(await client.from("stamp_unlocks").upsert(unlockRows, { onConflict: "stamp_id,participant_id" }), "stamp unlocks");

  if (source.companionProgress) {
    const companionResult = await client.from("companion_progress").upsert({
      id: stableUuid(session.trip.id, "companion", session.participant.id), trip_id: session.trip.id,
      participant_id: session.participant.id, companion_id: source.settings?.companionProfileId ?? "travel-os",
      level: source.companionProgress.level, xp: source.companionProgress.xp, mood: source.companionProgress.mood,
    }, { onConflict: "trip_id,participant_id" });
    assertResult(companionResult, "companion progress");
  }

  if (canEditPlan) {
    await removeMissingPlannedRows(client, session.trip.id, "activities", source.itinerary.flatMap((day) => day.activities.map((activity) => activity.id)));
    await removeMissingPlannedRows(client, session.trip.id, "trip_days", source.itinerary.map((day) => day.id));
    await removeMissingPlannedRows(client, session.trip.id, "locations", locationRows.map((row) => String(row.stable_key)));
  }
  if (canManageReservations) {
    await removeMissingPlannedRows(client, session.trip.id, "reservations", source.reservations.map((reservation) => reservation.id));
  }
  return session;
}

function remoteParticipants(rows: Array<{ id: string; display_name: string; avatar_url: string | null }>): Participant[] {
  return rows.map((row, index) => ({ id: row.id, name: row.display_name, initials: initialsFor(row.display_name), color: participantColors[index % participantColors.length], avatarUrl: row.avatar_url ?? undefined }));
}

export async function loadAuthorizedTrip(token: string): Promise<CloudTripPayload> {
  const session = await getTravelSession(token);
  const client = createTravelClient(token);
  const [tripResult, participantsResult, daysResult, locationsResult, activitiesResult, reservationsResult, expensesResult, stampsResult, unlocksResult, photosResult, companionResult, importsResult] = await Promise.all([
    client.from("trips").select("*").single(),
    client.from("participants").select("*").order("created_at"),
    client.from("trip_days").select("*").order("day_date"),
    client.from("locations").select("*"),
    client.from("activities").select("*").order("order_index"),
    client.from("reservations").select("*").order("reservation_date"),
    client.from("expenses").select("*").order("expense_date", { ascending: false }),
    client.from("passport_stamps").select("*"),
    client.from("stamp_unlocks").select("*"),
    client.from("photos").select("*").order("taken_at", { ascending: false }),
    client.from("companion_progress").select("*").eq("participant_id", session.participant.id).maybeSingle(),
    client.from("trip_imports").select("*").order("imported_at", { ascending: false }),
  ]);
  for (const [label, result] of [["trip", tripResult], ["participants", participantsResult], ["days", daysResult], ["locations", locationsResult], ["activities", activitiesResult], ["reservations", reservationsResult], ["expenses", expensesResult], ["stamps", stampsResult], ["unlocks", unlocksResult], ["photos", photosResult], ["companion", companionResult], ["imports", importsResult]] as const) assertResult(result, label);

  const remoteTrip = tripResult.data;
  if (!remoteTrip) throw new Error("TRIP_NOT_FOUND");
  const countryId = countryIdFor(remoteTrip.primary_country_code);
  const theme = countryThemeById[countryId] ?? countryThemeById.other;
  let trip = remoteTrip.slug === "japan-2026" ? clone(japan2026Trip) : createEmptyTrip({
    name: remoteTrip.name, countryId, startDate: remoteTrip.start_date, endDate: remoteTrip.end_date,
    currency: currencyFor(remoteTrip.primary_currency), destinationTimeZone: remoteTrip.destination_timezone,
    initialCity: theme.name, participantNames: [], creatorName: session.participant.name,
  });
  const extensionRow = (importsResult.data ?? []).find((row) => row.changes_applied?.kind === "travel_os_app_state");
  const extension = extensionRow?.changes_applied ?? {};
  trip = {
    ...trip,
    ...extension,
    id: remoteTrip.id,
    name: remoteTrip.name,
    countryId,
    startDate: remoteTrip.start_date,
    endDate: remoteTrip.end_date,
    dateRange: formatDateRange(remoteTrip.start_date, remoteTrip.end_date),
    countdownDays: Math.max(0, Math.ceil((Date.parse(`${remoteTrip.start_date}T00:00:00Z`) - Date.now()) / 86400000)),
    timezones: { origin: remoteTrip.origin_timezone, destination: remoteTrip.destination_timezone },
    participants: remoteParticipants(participantsResult.data ?? []),
    settings: { ...trip.settings!, ...(extension.settings ?? {}), storageMode: "cloud", mapProvider: remoteTrip.map_provider === "open" ? "open" : "google" },
  };

  const locations = new Map((locationsResult.data ?? []).map((row) => [row.id, row]));
  const templateDays = new Map(trip.itinerary.map((day) => [day.id, day]));
  const templateActivities = new Map(trip.itinerary.flatMap((day) => day.activities.map((activity) => [activity.id, activity] as const)));
  const activitiesByDay = new Map<string, Activity[]>();
  for (const row of activitiesResult.data ?? []) {
    const extra = decodeNote(row.notes);
    const location = locations.get(row.location_id);
    const template = templateActivities.get(row.stable_key);
    const activity: Activity = {
      ...(template ?? {} as Activity), id: row.stable_key, title: row.name, date: "", startTime: row.activity_time?.slice(0, 5) ?? undefined,
      endTime: typeof extra.endTime === "string" ? extra.endTime : template?.endTime,
      city: typeof extra.city === "string" ? extra.city : template?.city,
      category: row.category, categories: Array.isArray(extra.categories) ? extra.categories : template?.categories ?? [row.category],
      location: { id: location?.stable_key, tripId: remoteTrip.id, name: location?.name ?? row.name, address: location?.address ?? null, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null, placeId: location?.place_id ?? null },
      estimatedCost: row.cost ?? undefined, currency: row.currency ?? undefined, notes: extra.note,
      optional: Boolean(extra.optional), hiddenGem: Boolean(row.hidden_gem), completed: Boolean(row.completed),
      reservationId: row.reservation_id ? (reservationsResult.data ?? []).find((item) => item.id === row.reservation_id)?.stable_key : undefined,
      stampId: typeof extra.stampId === "string" ? extra.stampId : undefined,
      flightSegmentId: typeof extra.flightSegmentId === "string" ? extra.flightSegmentId : undefined,
    };
    activitiesByDay.set(row.trip_day_id, [...(activitiesByDay.get(row.trip_day_id) ?? []), activity]);
  }
  if ((daysResult.data ?? []).length) trip.itinerary = (daysResult.data ?? []).map((row): TripDay => {
    const extra = decodeNote(row.notes);
    const template = templateDays.get(row.stable_key);
    return {
      ...(template ?? {} as TripDay), id: row.stable_key, date: row.day_date, ...dateLabels(row.day_date), city: row.city ?? template?.city ?? trip.currentCity,
      visitedCity: typeof extra.visitedCity === "string" ? extra.visitedCity : template?.visitedCity,
      baseId: row.base_name ?? template?.baseId, previousBaseId: typeof extra.previousBaseId === "string" ? extra.previousBaseId : template?.previousBaseId,
      area: row.title ?? template?.area ?? row.city, dayType: (typeof extra.dayType === "string" ? extra.dayType : template?.dayType ?? "standard") as TripDayType,
      weather: typeof extra.weather === "string" ? extra.weather : template?.weather, notes: extra.note,
      hiddenGem: typeof extra.hiddenGem === "string" ? extra.hiddenGem : template?.hiddenGem,
      flexible: typeof extra.flexible === "boolean" ? extra.flexible : template?.flexible,
      activities: (activitiesByDay.get(row.id) ?? []).map((activity) => ({ ...activity, date: row.day_date })),
    };
  });

  trip.savedPlaces = (locationsResult.data ?? []).filter((row) => row.stable_key?.startsWith("saved:")).map((row): TripLocation => ({
    id: row.stable_key.slice(6), tripId: remoteTrip.id, name: row.name, address: row.address, latitude: row.latitude, longitude: row.longitude, placeId: row.place_id,
  }));
  trip.reservations = (reservationsResult.data ?? []).map((row): Reservation => {
    const extra = decodeNote(row.notes);
    return {
      id: row.stable_key, type: row.reservation_type, provider: typeof extra.provider === "string" ? extra.provider : "",
      code: row.confirmation ?? "", title: row.name, subtitle: typeof extra.subtitle === "string" ? extra.subtitle : "",
      date: typeof extra.displayDate === "string" ? extra.displayDate : row.reservation_date, dateISO: row.reservation_date,
      time: typeof extra.time === "string" ? extra.time : row.reservation_time?.slice(0, 5) ?? "",
      status: extra.status === "pending" ? "pending" : "confirmed", accent: typeof extra.accent === "string" ? extra.accent : theme.colors.accent,
      meta: typeof extra.meta === "string" ? extra.meta : "", documentIds: Array.isArray(extra.documentIds) ? extra.documentIds as string[] : undefined,
      qrCode: typeof extra.qrCode === "string" ? extra.qrCode : undefined,
    };
  });
  trip.expenses = (expensesResult.data ?? []).map((row): Expense => {
    const extra = decodeNote(row.note);
    return {
      id: typeof extra.originalId === "string" ? extra.originalId : `expense-${row.id}`,
      title: typeof extra.title === "string" ? extra.title : row.category,
      category: row.category, amount: Number(row.amount), currency: currencyFor(row.currency), paidBy: row.participant_id,
      scope: row.is_shared ? "shared" : "individual", splitBetween: Array.isArray(extra.splitBetween) ? extra.splitBetween as string[] : [row.participant_id],
      date: row.expense_date, icon: typeof extra.icon === "string" ? extra.icon : "¤",
    };
  });

  const stampIdToStableKey = new Map((stampsResult.data ?? []).map((row) => [row.id, row.stable_key]));
  const photoIdToClientId = new Map<string, string>();
  const photos: TravelPhoto[] = [];
  for (const row of photosResult.data ?? []) {
    const signed = await client.storage.from("travel-photos").createSignedUrl(row.storage_path, 60 * 60);
    if (signed.error) continue;
    const clientId = `photo-${row.id}`;
    photoIdToClientId.set(row.id, clientId);
    const capturedAt = row.captured_at ?? row.taken_at ?? row.created_at;
    photos.push({
      id: clientId,
      tripId: remoteTrip.id,
      dataUrl: signed.data.signedUrl,
      storagePath: row.storage_path,
      createdAt: row.taken_at ?? capturedAt,
      capturedAt,
      participantId: row.participant_id,
      activityId: (activitiesResult.data ?? []).find((item) => item.id === row.activity_id)?.stable_key,
      locationId: locations.get(row.location_id)?.stable_key,
      achievementId: stampIdToStableKey.get(row.stamp_id),
      note: row.note ?? undefined,
      location: row.latitude != null && row.longitude != null ? {
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.accuracy_m ?? 0,
        timestamp: Date.parse(capturedAt),
      } : undefined,
      geolocationSource: row.geolocation_source ?? "none",
      timezone: row.timezone ?? undefined,
      localDate: row.local_date ?? undefined,
      localTime: row.local_time?.slice(0, 8) ?? undefined,
      placeLabel: row.place_label ?? locations.get(row.location_id)?.name ?? undefined,
      exifMetadata: row.exif_metadata ?? {},
      isTest: Boolean(row.is_test),
    });
  }
  trip.photos = photos;

  const unlocksByStamp = new Map<string, Array<{ participantId: string; unlockedAt: string; photoId?: string }>>();
  for (const row of unlocksResult.data ?? []) {
    const key = stampIdToStableKey.get(row.stamp_id);
    if (!key) continue;
    unlocksByStamp.set(key, [...(unlocksByStamp.get(key) ?? []), { participantId: row.participant_id, unlockedAt: row.unlocked_at, photoId: photoIdToClientId.get(row.photo_id) }]);
  }
  if ((stampsResult.data ?? []).length) trip.achievements = (stampsResult.data ?? []).map((row): Achievement => {
    const extra = decodeNote(row.unlock_condition);
    const unlocks = unlocksByStamp.get(row.stable_key) ?? [];
    return {
      id: row.stable_key, title: row.name, description: row.description ?? "", icon: typeof extra.icon === "string" ? extra.icon : "✦",
      color: typeof extra.color === "string" ? extra.color : theme.colors.accent, category: row.category,
      unlockMethods: Array.isArray(extra.unlockMethods) ? extra.unlockMethods : ["manual"], geoTriggers: Array.isArray(extra.geoTriggers) ? extra.geoTriggers : undefined,
      unlockedBy: unlocks.map((item) => item.participantId), location: typeof extra.location === "string" ? extra.location : row.city ?? theme.name,
      city: row.city ?? undefined, rarity: row.rarity ?? "common", custom: row.source === "custom",
      unlockedAt: Object.fromEntries(unlocks.map((item) => [item.participantId, item.unlockedAt])),
      unlockedPhotoIds: Object.fromEntries(unlocks.filter((item) => item.photoId).map((item) => [item.participantId, item.photoId!])),
    };
  });
  if (companionResult.data) trip.companionProgress = {
    level: companionResult.data.level, xp: companionResult.data.xp, mood: companionResult.data.mood,
    enabled: trip.companionProgress?.enabled ?? true, lastMessage: trip.companionProgress?.lastMessage,
  };
  return { trip, session };
}

export async function migrateJapanIfNeeded(token: string) {
  const session = await getTravelSession(token);
  if (session.participant.role !== "owner" || session.trip.slug !== "japan-2026") return { migrated: false };
  const client = createTravelClient(token);
  await ensureMigrationParticipants(client, session, japan2026Trip);
  const count = await client.from("trip_days").select("id", { count: "exact", head: true });
  assertResult(count, "trip days count");
  if ((count.count ?? 0) > 0) return { migrated: false };
  await syncAuthorizedTrip(token, japan2026Trip, { migration: true });
  return { migrated: true };
}
