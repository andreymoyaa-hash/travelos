import type {
  Activity,
  ActivityCategory,
  Currency,
  Reservation,
  ReservationType,
  Trip,
  TripBase,
  TripDay,
  TripDayType,
} from "@/types/travel";

const ACTIVITY_CATEGORIES: readonly ActivityCategory[] = [
  "travel", "transport", "food", "geek", "shopping", "culture", "temple", "photography", "nature",
  "viewpoint", "gaming", "anime", "theme-park", "leisure",
];
const DAY_TYPES: readonly TripDayType[] = ["standard", "travel", "base-transition", "theme-park", "pokemon-full-day", "flexible", "relaxed", "recovery"];
const RESERVATION_TYPES: readonly ReservationType[] = ["flight", "hotel", "train", "ticket", "restaurant", "transport", "other"];
const CURRENCIES: readonly Currency[] = ["JPY", "CRC", "USD", "MXN", "EUR", "COP", "CLP", "ARS", "KRW"];
const MAX_PDF_BYTES = 12 * 1024 * 1024;

type UnknownRecord = Record<string, unknown>;

export interface TravelPdfImportPreview {
  fileName: string;
  checksum: string;
  standardVersion: string;
  pageCount: number;
  days: TripDay[];
  reservations: Reservation[];
  bases: TripBase[];
  warnings: string[];
  summary: {
    daysChanged: number;
    activitiesChanged: number;
    reservationsChanged: number;
    basesChanged: number;
  };
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stableSuffix(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function dateLabels(date: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.valueOf())) throw new Error(`Fecha inválida: ${date}`);
  return {
    weekday: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][parsed.getUTCDay()],
    dayNumber: date.slice(-2),
    month: ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"][parsed.getUTCMonth()],
  };
}

function validIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

function normalizeActivity(value: unknown, dayDate: string, index: number, defaultCurrency: Currency): Activity {
  const raw = asRecord(value);
  const title = asString(raw.title ?? raw.name);
  if (!title) throw new Error(`Actividad ${index + 1} del ${dayDate}: falta el nombre.`);
  const startTime = asString(raw.startTime ?? raw.time);
  const categoryValue = asString(raw.category) as ActivityCategory;
  const category = ACTIVITY_CATEGORIES.includes(categoryValue) ? categoryValue : "travel";
  const suppliedCategories = Array.isArray(raw.categories)
    ? raw.categories.map(asString).filter((item): item is ActivityCategory => ACTIVITY_CATEGORIES.includes(item as ActivityCategory))
    : [];
  const location = asRecord(raw.location);
  const currencyValue = asString(raw.currency).toUpperCase() as Currency;
  const estimatedCost = typeof raw.estimatedCost === "number" && Number.isFinite(raw.estimatedCost) ? Math.max(0, raw.estimatedCost) : undefined;
  const id = asString(raw.id) || `pdf-activity-${stableSuffix(`${dayDate}|${startTime}|${title}|${index}`)}`;
  return {
    id,
    title,
    date: dayDate,
    startTime: /^\d{2}:\d{2}$/.test(startTime) ? startTime : undefined,
    endTime: /^\d{2}:\d{2}$/.test(asString(raw.endTime)) ? asString(raw.endTime) : undefined,
    city: asString(raw.city) || undefined,
    category,
    categories: suppliedCategories.length ? suppliedCategories : [category],
    location: {
      name: asString(location.name) || title,
      address: asString(location.address) || null,
      latitude: typeof location.latitude === "number" && Number.isFinite(location.latitude) ? location.latitude : null,
      longitude: typeof location.longitude === "number" && Number.isFinite(location.longitude) ? location.longitude : null,
      placeId: asString(location.placeId) || null,
    },
    estimatedCost,
    currency: estimatedCost !== undefined ? (CURRENCIES.includes(currencyValue) ? currencyValue : defaultCurrency) : undefined,
    notes: asString(raw.notes) || undefined,
    optional: raw.optional === true,
    hiddenGem: raw.hiddenGem === true,
    completed: raw.completed === true,
    reservationId: asString(raw.reservationId) || undefined,
    stampId: asString(raw.stampId) || undefined,
  };
}

function normalizeDay(value: unknown, index: number, trip: Trip): TripDay {
  const raw = asRecord(value);
  const date = asString(raw.date);
  const city = asString(raw.city);
  const area = asString(raw.area ?? raw.title);
  if (!validIsoDate(date)) throw new Error(`Día ${index + 1}: la fecha debe usar YYYY-MM-DD.`);
  if (date < trip.startDate || date > trip.endDate) throw new Error(`El día ${date} está fuera del rango de ${trip.name}.`);
  if (!city || !area) throw new Error(`Día ${date}: ciudad y área son obligatorias.`);
  const dayTypeValue = asString(raw.dayType) as TripDayType;
  const activities = Array.isArray(raw.activities)
    ? raw.activities.map((activity, activityIndex) => normalizeActivity(activity, date, activityIndex, trip.budget.currency))
    : [];
  return {
    id: asString(raw.id) || `pdf-day-${stableSuffix(date)}`,
    date,
    ...dateLabels(date),
    city,
    visitedCity: asString(raw.visitedCity) || undefined,
    baseId: asString(raw.baseId) || undefined,
    previousBaseId: asString(raw.previousBaseId) || undefined,
    area,
    dayType: DAY_TYPES.includes(dayTypeValue) ? dayTypeValue : "standard",
    weather: asString(raw.weather) || undefined,
    notes: asString(raw.notes) || undefined,
    hiddenGem: asString(raw.hiddenGem) || undefined,
    flexible: raw.flexible === true,
    activities,
  };
}

function normalizeReservation(value: unknown, index: number, trip: Trip): Reservation {
  const raw = asRecord(value);
  const title = asString(raw.title ?? raw.name);
  const dateISO = asString(raw.dateISO ?? raw.date);
  if (!title || !validIsoDate(dateISO)) throw new Error(`Reserva ${index + 1}: nombre y fecha YYYY-MM-DD son obligatorios.`);
  if (dateISO < trip.startDate || dateISO > trip.endDate) throw new Error(`La reserva “${title}” está fuera del rango del viaje.`);
  const typeValue = asString(raw.type) as ReservationType;
  const id = asString(raw.id) || `pdf-reservation-${stableSuffix(`${dateISO}|${title}|${asString(raw.code)}`)}`;
  return {
    id,
    type: RESERVATION_TYPES.includes(typeValue) ? typeValue : "other",
    provider: asString(raw.provider),
    code: asString(raw.code),
    title,
    subtitle: asString(raw.subtitle),
    date: asString(raw.displayDate) || dateISO,
    dateISO,
    time: /^\d{2}:\d{2}$/.test(asString(raw.time)) ? asString(raw.time) : "",
    status: raw.status === "pending" ? "pending" : "confirmed",
    accent: asString(raw.accent) || "#6f56b7",
    meta: asString(raw.meta),
    documentIds: [],
  };
}

function normalizeBase(value: unknown, index: number, trip: Trip): TripBase {
  const raw = asRecord(value);
  const city = asString(raw.city);
  const checkInDate = asString(raw.checkInDate);
  const checkOutDate = asString(raw.checkOutDate);
  if (!city || !validIsoDate(checkInDate) || !validIsoDate(checkOutDate)) throw new Error(`Alojamiento ${index + 1}: ciudad, check-in y check-out son obligatorios.`);
  if (checkInDate < trip.startDate || checkOutDate > trip.endDate || checkOutDate < checkInDate) throw new Error(`El alojamiento de ${city} tiene fechas fuera del viaje.`);
  const location = asRecord(raw.location);
  const nights = Math.max(0, Math.round((Date.parse(`${checkOutDate}T12:00:00Z`) - Date.parse(`${checkInDate}T12:00:00Z`)) / 86400000));
  return {
    id: asString(raw.id) || `pdf-base-${stableSuffix(`${city}|${checkInDate}`)}`,
    city,
    icon: asString(raw.icon) || "hotel",
    checkInDate,
    checkOutDate,
    nights,
    status: raw.status === "confirmed" ? "confirmed" : "pending",
    area: asString(raw.area) || null,
    location: {
      name: asString(location.name) || city,
      address: asString(location.address) || null,
      latitude: typeof location.latitude === "number" && Number.isFinite(location.latitude) ? location.latitude : null,
      longitude: typeof location.longitude === "number" && Number.isFinite(location.longitude) ? location.longitude : null,
      placeId: asString(location.placeId) || null,
    },
    checkInTime: /^\d{2}:\d{2}$/.test(asString(raw.checkInTime)) ? asString(raw.checkInTime) : null,
    checkOutTime: /^\d{2}:\d{2}$/.test(asString(raw.checkOutTime)) ? asString(raw.checkOutTime) : null,
    reservationCode: asString(raw.reservationCode) || undefined,
    provider: asString(raw.provider) || undefined,
    documentIds: [],
    photoIds: [],
  };
}

function extractJson(text: string) {
  const headingIndex = text.search(/(?:TRAVEL\s+OS|NIOLI)\s+PDF\s+STANDARD/i);
  if (headingIndex < 0) throw new Error("El documento no declara Nioli PDF Standard.");
  const markerStart = text.indexOf("BEGIN_TRAVEL_OS_JSON", headingIndex);
  const markerEnd = text.indexOf("END_TRAVEL_OS_JSON", markerStart + 1);
  const source = markerStart >= 0 && markerEnd > markerStart
    ? text.slice(markerStart + "BEGIN_TRAVEL_OS_JSON".length, markerEnd)
    : text.slice(headingIndex);
  const firstBrace = source.indexOf("{");
  const lastBrace = source.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error("No se encontró el bloque JSON planificado dentro del PDF.");
  try {
    return asRecord(JSON.parse(source.slice(firstBrace, lastBrace + 1)));
  } catch {
    throw new Error("El bloque JSON del PDF no es válido.");
  }
}

async function extractPdfText(data: Uint8Array) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data });
  const document = await loadingTask.promise;
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
    }
    return { text: pages.join("\n"), pageCount: document.numPages };
  } finally {
    await loadingTask.destroy();
  }
}

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function parseTravelOsPdf(file: File, trip: Trip): Promise<TravelPdfImportPreview> {
  if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) throw new Error("Selecciona un archivo PDF.");
  if (file.size <= 0 || file.size > MAX_PDF_BYTES) throw new Error("El PDF debe pesar entre 1 byte y 12 MB.");
  const buffer = await file.arrayBuffer();
  const [checksumBuffer, extracted] = await Promise.all([
    crypto.subtle.digest("SHA-256", buffer.slice(0)),
    extractPdfText(new Uint8Array(buffer.slice(0))),
  ]);
  const root = extractJson(extracted.text);
  const standard = asString(root.standard ?? root.format).toLowerCase();
  if (standard && !["nioli-pdf", "nioli pdf standard", "travel-os-pdf", "travel os pdf standard"].includes(standard)) throw new Error("El formato declarado no es Nioli PDF Standard.");
  const version = asString(root.standardVersion ?? root.version) || "1";
  if (!version.startsWith("1")) throw new Error(`La versión ${version} de Nioli PDF Standard no está soportada.`);
  const planned = asRecord(root.plannedData ?? root.planned);
  const days = Array.isArray(planned.days) ? planned.days.map((day, index) => normalizeDay(day, index, trip)) : [];
  const reservations = Array.isArray(planned.reservations) ? planned.reservations.map((reservation, index) => normalizeReservation(reservation, index, trip)) : [];
  const bases = Array.isArray(planned.bases) ? planned.bases.map((base, index) => normalizeBase(base, index, trip)) : [];
  if (!days.length && !reservations.length && !bases.length) throw new Error("El PDF no contiene PlannedData importable.");
  const duplicateDates = days.filter((day, index) => days.findIndex((candidate) => candidate.date === day.date) !== index).map((day) => day.date);
  if (duplicateDates.length) throw new Error(`El PDF repite fechas de itinerario: ${Array.from(new Set(duplicateDates)).join(", ")}.`);
  return {
    fileName: file.name,
    checksum: hex(checksumBuffer),
    standardVersion: `travel-os-pdf-v${version}`,
    pageCount: extracted.pageCount,
    days,
    reservations,
    bases,
    warnings: ["La importación combina PlannedData por fecha o identificador; no elimina LiveData ni planes que el PDF no menciona."],
    summary: {
      daysChanged: days.length,
      activitiesChanged: days.reduce((total, day) => total + day.activities.length, 0),
      reservationsChanged: reservations.length,
      basesChanged: bases.length,
    },
  };
}

function mergeActivities(existing: Activity[], incoming: Activity[]) {
  const next = [...existing];
  for (const activity of incoming) {
    const index = next.findIndex((item) => item.id === activity.id || (item.title === activity.title && item.startTime === activity.startTime));
    if (index < 0) next.push(activity);
    else next[index] = { ...next[index], ...activity, id: next[index].id };
  }
  return next;
}

export function applyPlannedPdfImport(trip: Trip, preview: TravelPdfImportPreview): Trip {
  const itinerary = [...trip.itinerary];
  for (const day of preview.days) {
    const index = itinerary.findIndex((item) => item.date === day.date || item.id === day.id);
    if (index < 0) itinerary.push(day);
    else itinerary[index] = { ...itinerary[index], ...day, id: itinerary[index].id, activities: mergeActivities(itinerary[index].activities, day.activities) };
  }
  const reservations = [...trip.reservations];
  for (const reservation of preview.reservations) {
    const index = reservations.findIndex((item) => item.id === reservation.id || (item.code && item.code === reservation.code) || (item.title === reservation.title && item.dateISO === reservation.dateISO));
    if (index < 0) reservations.push(reservation);
    else reservations[index] = { ...reservations[index], ...reservation, id: reservations[index].id };
  }
  const bases = [...trip.bases];
  for (const base of preview.bases) {
    const index = bases.findIndex((item) => item.id === base.id || (item.city === base.city && item.checkInDate === base.checkInDate));
    if (index < 0) bases.push(base);
    else bases[index] = { ...bases[index], ...base, id: bases[index].id, photoIds: bases[index].photoIds, documentIds: bases[index].documentIds };
  }
  return {
    ...trip,
    itinerary: itinerary.sort((a, b) => a.date.localeCompare(b.date)),
    reservations: reservations.sort((a, b) => (a.dateISO ?? a.date).localeCompare(b.dateISO ?? b.date)),
    bases: bases.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate)),
    settings: trip.settings ? {
      ...trip.settings,
      lastPdfImport: {
        fileName: preview.fileName,
        checksum: preview.checksum,
        standardVersion: preview.standardVersion,
        importedAt: new Date().toISOString(),
        daysChanged: preview.summary.daysChanged,
        activitiesChanged: preview.summary.activitiesChanged,
        reservationsChanged: preview.summary.reservationsChanged,
      },
      updatedAt: new Date().toISOString(),
    } : trip.settings,
  };
}
