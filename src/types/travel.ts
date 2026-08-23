export type FeatureId =
  | "dashboard"
  | "itinerary"
  | "expenses"
  | "reservations"
  | "map"
  | "adventure";

export type CountryId = "japan" | "mexico" | "korea" | "usa" | "other";
export type Currency = "JPY" | "CRC" | "USD";

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
  };
  categories: string[];
}

export interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  avatarUrl?: string;
}

// Compatibility alias for integrations that still use the Phase 1 name.
export type Traveler = Participant;

export interface Budget {
  amount: number;
  currency: Currency;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  category: "culture" | "food" | "transport" | "shopping" | "leisure";
  estimatedCost: number;
  note?: string;
  completed?: boolean;
}

export interface ItineraryDay {
  id: string;
  date: string;
  weekday: string;
  dayNumber: string;
  month: string;
  city: string;
  area: string;
  weather?: string;
  activities: Activity[];
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

export type ReservationType = "flight" | "hotel" | "train" | "ticket" | "restaurant";

export interface Reservation {
  id: string;
  type: ReservationType;
  provider: string;
  code: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  status: "confirmed" | "pending";
  accent: string;
  meta: string;
}

export type AchievementCategory =
  | "travel"
  | "transport"
  | "kyoto"
  | "food"
  | "geek"
  | "entertainment";

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
  dataUrl: string;
  createdAt: string;
  participantId: string;
  location?: GeoPosition;
  achievementId?: string;
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
  dateRange: string;
  countdownDays: number;
  currentCity: string;
  participants: Participant[];
  route: string[];
  bases: Array<{ city: string; nights: number; icon: string }>;
  budget: Budget;
  itinerary: ItineraryDay[];
  expenses: Expense[];
  reservations: Reservation[];
  achievements: Achievement[];
  photos: TravelPhoto[];
  routeOptions: RouteOption[];
}
