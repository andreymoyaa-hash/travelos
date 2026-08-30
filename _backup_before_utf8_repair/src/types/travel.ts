export type FeatureId =
  | "trips"
  | "dashboard"
  | "itinerary"
  | "expenses"
  | "reservations"
  | "map"
  | "adventure";

export type CountryId = "japan" | "mexico" | "colombia" | "usa" | "spain" | "chile" | "argentina" | "korea" | "costa-rica" | "other";
export type Currency = "JPY" | "CRC" | "USD" | "MXN" | "EUR" | "COP" | "CLP" | "ARS" | "KRW";
export type MapProvider = "google" | "open";

export type StorageMode = "local" | "cloud";
export type TripMemberRole = "owner" | "editor" | "participant" | "viewer";

export interface CountryTheme {
  id: CountryId;
  name: string;
  flag: string;
  headline: string;
  description: string;
  landmark: string;
  colors: {
    accent: string;
    accentDark: string;
    soft: string;
    highlight: string;
    ink: string;
    paper: string;
    surface: string;
    secondary: string;
    nature: string;
    cultural: string;
    premium: string;
  };
  routeColors: {
    travel: string;
    transition: string;
    bases: string[];
  };
  categories: string[];
  countryCode: string;
  typographyAccent: string;
  patterns: string[];
  decorativeStyle: "japan" | "mexico" | "international";
  iconTreatment: string;
  passportStyle: string;
  companionStyle: string;
  labels: {
    greeting: string;
    route: string;
    passport: string;
  };
}

export interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  avatarUrl?: string;
}

export type Traveler = Participant;

export interface Budget {
  amount: number;
  currency: Currency;
}

export interface TripLocation {
  id?: string;
  tripId?: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
}

export interface WorldClockLocation {
  city: string;
  countryCode: string;
  timeZone: string;
}

export interface WorldClockConfig {
  origin: WorldClockLocation;
  destination: WorldClockLocation;
}

export interface ReservationReference {
  reservationId?: string;
}

export interface TravelStampReference {
  stampId?: string;
}

export type ActivityCategory =
  | "travel"
  | "transport"
  | "food"
  | "geek"
  | "shopping"
  | "culture"
  | "temple"
  | "photography"
  | "nature"
  | "viewpoint"
  | "gaming"
  | "anime"
  | "theme-park"
  | "leisure";

export interface Activity extends ReservationReference, TravelStampReference {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  city?: string;
  category: ActivityCategory;
  categories: ActivityCategory[];
  location: TripLocation;
  estimatedCost?: number;
  currency?: Currency;
  notes?: string;
  optional?: boolean;
  hiddenGem?: boolean;
  completed?: boolean;
  flightSegmentId?: string;
}

export type TripDayType =
  | "standard"
  | "travel"
  | "base-transition"
  | "theme-park"
  | "pokemon-full-day"
  | "flexible"
  | "relaxed"
  | "recovery";

export interface TripDay {
  id: string;
  date: string;
  weekday: string;
  dayNumber: string;
  month: string;
  city: string;
  visitedCity?: string;
  baseId?: string;
  previousBaseId?: string;
  area: string;
  dayType: TripDayType;
  weather?: string;
  notes?: string;
  hiddenGem?: string;
  flexible?: boolean;
  activities: Activity[];
}

export type ItineraryDay = TripDay;

export type AccommodationStatus = "confirmed" | "pending";

export interface TripBase extends ReservationReference {
  id: string;
  city: string;
  icon: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: AccommodationStatus;
  area: string | null;
  location: TripLocation;
  checkInTime: string | null;
  checkOutTime: string | null;
  reservationCode?: string;
  provider?: string;
  price?: number;
  currency?: Currency;
  documentIds: string[];
  photoIds: string[];
}

export interface FlightEndpoint {
  airportCode: string;
  city: string;
  terminal?: string;
  dateTime: string;
  timezone: string;
}

export interface FlightSegment {
  id: string;
  airline: string;
  flightNumber: string;
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  durationMinutes: number;
  aircraft: string;
  layoverAfter?: {
    city: string;
    durationMinutes: number;
  };
}

export type ExpenseCategory =
  | "food"
  | "shopping"
  | "transport"
  | "lodging"
  | "tickets"
  | "gaming"
  | "pokemon"
  | "souvenirs"
  | "other";

export type ExpenseScope = "individual" | "shared";

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: Currency;
  paidBy: string;
  scope: ExpenseScope;
  splitBetween: string[];
  date: string;
  icon: string;
}

export type ReservationType = "flight" | "hotel" | "train" | "ticket" | "restaurant" | "transport" | "other";

export interface Reservation {
  id: string;
  type: ReservationType;
  provider: string;
  code: string;
  title: string;
  subtitle: string;
  date: string;
  dateISO?: string;
  time: string;
  status: "confirmed" | "pending";
  accent: string;
  meta: string;
  documentIds?: string[];
  qrCode?: string;
}

export type AchievementCategory =
  | "travel"
  | "transport"
  | "kyoto"
  | "food"
  | "geek"
  | "entertainment"
  | "culture"
  | "landmark"
  | "museum"
  | "market"
  | "nature"
  | "neighborhood";

export type PassportStampShape =
  | "round"
  | "oval"
  | "rectangle"
  | "square"
  | "arch"
  | "ticket"
  | "hanko";

export interface PassportStampVisual {
  shape: PassportStampShape;
  ink: string;
  motif: string;
  label: string;
  rotationDeg?: number;
  assetPath?: string;
}

export interface AchievementSource {
  label: string;
  url: string;
}

export interface AchievementCatalog {
  countryId: CountryId;
  countryCode: string;
  version: number;
  categories: AchievementCategory[];
  achievements: Achievement[];
}

export type AchievementUnlockMethod = "manual" | "gps" | "photo";

export interface GeoTrigger {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: AchievementCategory;
  unlockMethods: AchievementUnlockMethod[];
  geoTriggers?: GeoTrigger[];
  unlockedBy: string[];
  location: string;
  city?: string;
  region?: string;
  hint?: string;
  discovery?: "visible" | "hinted" | "secret";
  stamp?: PassportStampVisual;
  source?: AchievementSource;
  rarity?: "common" | "special" | "rare";
  custom?: boolean;
  unlockedAt?: Record<string, string>;
  unlockedPhotoIds?: Record<string, string>;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";

export interface TravelPhoto {
  id: string;
  tripId?: string;
  dataUrl: string;
  storagePath?: string;
  createdAt: string;
  participantId: string;
  location?: GeoPosition;
  achievementId?: string;
  activityId?: string;
  locationId?: string;
  dayId?: string;
  note?: string;
}

export interface TravelMemory {
  id: string;
  tripId: string;
  participantId: string;
  activityId?: string;
  locationId?: string;
  stampId?: string;
  dayId?: string;
  date: string;
  image: string;
  note?: string;
  createdAt: string;
  location?: GeoPosition;
}

export interface PassportTemplate {
  id: "japan" | "mexico" | "colombia" | "korea" | "usa" | "generic";
  name: string;
  description: string;
  categories: string[];
  stamps: Achievement[];
}

export interface CompanionProfile {
  id: "japan-geek" | "travel-os";
  name: string;
  icon: string;
  countryId: CountryId | "international";
  style: string;
}

export interface CompanionProgress {
  level: number;
  xp: number;
  mood: "curious" | "happy" | "resting" | "excited";
  enabled: boolean;
  lastMessage?: string;
  lastInteractionAt?: string;
}

export interface TripSettings {
  creatorName: string;
  destinationTimeZone: string;
  initialCity?: string;
  passportTemplateId: PassportTemplate["id"];
  companionProfileId: CompanionProfile["id"];
  storageMode: StorageMode;
  mapProvider?: MapProvider;
  lastPdfImport?: {
    fileName: string;
    checksum: string;
    standardVersion: string;
    importedAt: string;
    daysChanged: number;
    activitiesChanged: number;
    reservationsChanged: number;
  };
  protected?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RouteOption {
  id: "fastest" | "cheapest" | "walking";
  label: string;
  icon: string;
  description: string;
}

export interface Trip {
  id: string;
  name: string;
  countryId: CountryId;
  startDate: string;
  endDate: string;
  dateRange: string;
  countdownDays: number;
  currentCity: string;
  timezones: {
    origin: string;
    destination: string;
  };
  worldClock: WorldClockConfig;
  participants: Participant[];
  route: string[];
  bases: TripBase[];
  flightSegments: FlightSegment[];
  savedPlaces: TripLocation[];
  budget: Budget;
  itinerary: TripDay[];
  expenses: Expense[];
  reservations: Reservation[];
  achievements: Achievement[];
  photos: TravelPhoto[];
  routeOptions: RouteOption[];
  settings?: TripSettings;
  companionProgress?: CompanionProgress;
}

export interface TripInvite {
  id: string;
  tripId: string;
  code: string;
  role: TripMemberRole;
  createdBy: string;
  expiresAt?: string;
  usedBy?: string;
}
