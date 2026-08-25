import { companionProfileForCountry } from "@/data/companion-profiles";
import { countryThemeById } from "@/data/countries";
import { passportTemplateForCountry } from "@/data/passport-templates";
import type { CountryId, Currency, Participant, Trip, TripSettings } from "@/types/travel";

const STORAGE_KEY = "travel-os:trips:v2";
const ACTIVE_TRIP_KEY = "travel-os:active-trip:v2";
const LEGACY_TRIP_KEYS = ["travel-os:trip", "travel-os-trip", "travel-os:japan-2026"];
const SCHEMA_VERSION = 2;

interface StoredTrips {
  version: number;
  trips: Trip[];
}

export interface CreateTripInput {
  name: string;
  countryId: CountryId;
  initialCity?: string;
  startDate: string;
  endDate: string;
  currency: Currency;
  destinationTimeZone: string;
  participantNames: string[];
  creatorName: string;
}

export interface TripRepository {
  getTrips(seedTrip: Trip): Trip[];
  getTrip(id: string, seedTrip: Trip): Trip | null;
  createTrip(input: CreateTripInput, seedTrip: Trip): Trip;
  updateTrip(trip: Trip, seedTrip: Trip): Trip;
  deleteTrip(id: string, seedTrip: Trip): void;
  saveTripData(trip: Trip, seedTrip: Trip): Trip;
  getActiveTripId(): string | null;
  setActiveTripId(id: string): void;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const initialsFor = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VJ";
const participantColors = ["#6f56b7", "#df5753", "#0c8f69", "#d97732", "#2d6685", "#b15a73"];

const formatDateRange = (startDate: string, endDate: string) => {
  const formatter = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${formatter.format(new Date(`${startDate}T12:00:00Z`))} — ${formatter.format(new Date(`${endDate}T12:00:00Z`))}`;
};

const countdown = (startDate: string) => Math.max(0, Math.ceil((Date.parse(`${startDate}T00:00:00Z`) - Date.now()) / 86400000));

export const createEmptyTrip = (input: CreateTripInput): Trip => {
  const theme = countryThemeById[input.countryId] ?? countryThemeById.other;
  const template = passportTemplateForCountry(input.countryId);
  const companion = companionProfileForCountry(input.countryId);
  const now = new Date().toISOString();
  const participants: Participant[] = Array.from(new Set([input.creatorName, ...input.participantNames].map((name) => name.trim()).filter(Boolean))).map((name, index) => ({
    id: `participant-${crypto.randomUUID()}`,
    name,
    initials: initialsFor(name),
    color: participantColors[index % participantColors.length],
  }));
  const id = `trip-${crypto.randomUUID()}`;
  const settings: TripSettings = {
    creatorName: input.creatorName.trim(),
    destinationTimeZone: input.destinationTimeZone,
    initialCity: input.initialCity?.trim() || undefined,
    passportTemplateId: template.id,
    companionProfileId: companion.id,
    storageMode: "local",
    createdAt: now,
    updatedAt: now,
  };

  return {
    id,
    name: input.name.trim(),
    countryId: input.countryId,
    startDate: input.startDate,
    endDate: input.endDate,
    dateRange: formatDateRange(input.startDate, input.endDate),
    countdownDays: countdown(input.startDate),
    currentCity: input.initialCity?.trim() || theme.name,
    timezones: { origin: "America/Costa_Rica", destination: input.destinationTimeZone },
    worldClock: {
      origin: { city: "San José", countryCode: "CR", timeZone: "America/Costa_Rica" },
      destination: { city: input.initialCity?.trim() || theme.name, countryCode: theme.countryCode, timeZone: input.destinationTimeZone },
    },
    participants,
    route: input.initialCity?.trim() ? [input.initialCity.trim()] : [theme.name],
    bases: [],
    flightSegments: [],
    savedPlaces: [],
    budget: { amount: 0, currency: input.currency },
    itinerary: [],
    expenses: [],
    reservations: [],
    achievements: clone(template.stamps),
    photos: [],
    routeOptions: [
      { id: "fastest", label: "Más rápido", icon: "⚡", description: "Prioriza el menor tiempo de viaje." },
      { id: "cheapest", label: "Más barato", icon: "¤", description: "Compara sólo tarifas proporcionadas por Google." },
      { id: "walking", label: "Menos caminata", icon: "👟", description: "Reduce al mínimo los trayectos a pie." },
    ],
    settings,
    companionProgress: { level: 1, xp: 0, mood: "curious", enabled: true, lastMessage: "¿Qué exploramos primero?" },
  };
};

const normalizeTrip = (trip: Trip): Trip => {
  const template = passportTemplateForCountry(trip.countryId);
  const companion = companionProfileForCountry(trip.countryId);
  const now = new Date().toISOString();
  return {
    ...trip,
    savedPlaces: trip.savedPlaces ?? [],
    itinerary: trip.itinerary ?? [],
    expenses: trip.expenses ?? [],
    reservations: trip.reservations ?? [],
    achievements: trip.achievements ?? clone(template.stamps),
    photos: (trip.photos ?? []).map((photo) => ({ ...photo, tripId: photo.tripId ?? trip.id })),
    settings: trip.settings ?? {
      creatorName: trip.participants[0]?.name ?? "Viajero",
      destinationTimeZone: trip.timezones.destination,
      initialCity: trip.currentCity,
      passportTemplateId: template.id,
      companionProfileId: companion.id,
      storageMode: "local",
      protected: trip.id === "japan-2026",
      createdAt: now,
      updatedAt: now,
    },
    companionProgress: trip.companionProgress ?? { level: 1, xp: 0, mood: "curious", enabled: true },
  };
};

export class LocalTripRepository implements TripRepository {
  private read(seedTrip: Trip): StoredTrips {
    if (typeof window === "undefined") return { version: SCHEMA_VERSION, trips: [normalizeTrip(clone(seedTrip))] };
    let stored: StoredTrips | undefined;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredTrips;
        if (Array.isArray(parsed.trips)) stored = parsed;
      } catch { /* An invalid local snapshot is ignored; the real seed remains available. */ }
    }

    if (!stored) {
      for (const key of LEGACY_TRIP_KEYS) {
        const legacy = window.localStorage.getItem(key);
        if (!legacy) continue;
        try {
          const parsed = JSON.parse(legacy) as Trip;
          if (parsed && typeof parsed === "object") {
            stored = { version: SCHEMA_VERSION, trips: [normalizeTrip({ ...parsed, id: parsed.id || "japan-2026" })] };
            break;
          }
        } catch { /* Continue with the next legacy key. */ }
      }
    }

    const trips = (stored?.trips ?? []).map(normalizeTrip);
    const japanIndex = trips.findIndex((trip) => trip.id === seedTrip.id);
    if (japanIndex < 0) trips.unshift(normalizeTrip(clone(seedTrip)));
    const migrated = { version: SCHEMA_VERSION, trips };
    this.write(migrated);
    return migrated;
  }

  private write(value: StoredTrips) {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  getTrips(seedTrip: Trip) { return clone(this.read(seedTrip).trips); }
  getTrip(id: string, seedTrip: Trip) { return this.getTrips(seedTrip).find((trip) => trip.id === id) ?? null; }

  createTrip(input: CreateTripInput, seedTrip: Trip) {
    const trip = createEmptyTrip(input);
    const stored = this.read(seedTrip);
    stored.trips.push(trip);
    this.write(stored);
    return clone(trip);
  }

  updateTrip(trip: Trip, seedTrip: Trip) {
    const stored = this.read(seedTrip);
    const normalized = normalizeTrip({ ...trip, settings: trip.settings ? { ...trip.settings, updatedAt: new Date().toISOString() } : trip.settings });
    stored.trips = stored.trips.some((item) => item.id === trip.id)
      ? stored.trips.map((item) => item.id === trip.id ? normalized : item)
      : [...stored.trips, normalized];
    this.write(stored);
    return clone(normalized);
  }

  deleteTrip(id: string, seedTrip: Trip) {
    if (id === seedTrip.id) throw new Error("Japón 2026 es un viaje protegido.");
    const stored = this.read(seedTrip);
    stored.trips = stored.trips.filter((trip) => trip.id !== id);
    this.write(stored);
  }

  saveTripData(trip: Trip, seedTrip: Trip) { return this.updateTrip(trip, seedTrip); }
  getActiveTripId() { return typeof window === "undefined" ? null : window.localStorage.getItem(ACTIVE_TRIP_KEY); }
  setActiveTripId(id: string) { if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_TRIP_KEY, id); }
}

export const tripRepository: TripRepository = new LocalTripRepository();
