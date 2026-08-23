import { japanAchievements } from "@/data/japan-achievements";
import { japanItinerary } from "@/data/japan-itinerary";
import type { Trip } from "@/types/travel";

export const japanTrip: Trip = {
  id: "japan-2026",
  name: "Japón 2026",
  countryId: "japan",
  dateRange: "9 — 30 Nov 2026",
  countdownDays: 78,
  currentCity: "San José",
  participants: [
    { id: "andy", name: "Andy", initials: "AN", color: "#6f56b7" },
    { id: "jose", name: "José", initials: "JO", color: "#df5753" },
  ],
  route: ["Costa Rica", "México", "Narita"],
  bases: [
    { city: "Osaka", nights: 4, icon: "🏯" },
    { city: "Kyoto", nights: 5, icon: "⛩️" },
    { city: "Tokio", nights: 9, icon: "🗼" },
  ],
  budget: { amount: 0, currency: "JPY" },
  itinerary: japanItinerary,
  expenses: [],
  reservations: [],
  achievements: japanAchievements,
  photos: [],
  routeOptions: [
    { id: "fastest", label: "Más rápido", icon: "⚡", description: "Prioriza el menor tiempo de viaje." },
    { id: "cheapest", label: "Más barato", icon: "💴", description: "Prioriza el costo estimado más bajo." },
    { id: "walking", label: "Menos caminata", icon: "👟", description: "Reduce al mínimo los trayectos a pie." },
  ],
};
