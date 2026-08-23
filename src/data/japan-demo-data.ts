import type { Budget, Expense, Reservation } from "@/types/travel";

// Optional visual/demo fixtures. They are intentionally never loaded into a real trip.
export const japanDemoBudget: Budget = { amount: 620000, currency: "JPY" };

export const japanDemoExpenses: Expense[] = [
  { id: "demo-hotel", title: "Hotel de ejemplo", category: "lodging", amount: 68000, currency: "JPY", paidBy: "andy", scope: "shared", splitBetween: ["andy", "jose"], date: "18 Ago", icon: "🏨" },
];

export const japanDemoReservations: Reservation[] = [
  { id: "demo-flight", type: "flight", provider: "Aerolínea de ejemplo", code: "DEMO-001", title: "SJO → NRT", subtitle: "Reserva de demostración", date: "09 NOV", time: "00:00", status: "pending", accent: "#7357ad", meta: "No pertenece al viaje real" },
];
