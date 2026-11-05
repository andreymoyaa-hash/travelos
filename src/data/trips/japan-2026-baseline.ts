import type { Trip } from "@/types/travel";

export const japan2026Baseline = {
  tripId: "japan-2026",
  startDate: "2026-11-11",
  endDate: "2026-11-30",
  dayCount: 20,
  activityCount: 97,
  baseIds: ["osaka", "kyoto", "tokyo"],
  flightIds: [],
  participantIds: ["andy", "jose"],
  stampCount: 20,
  reservationCount: 6,
  expenseCount: 0,
  photoCount: 0,
} as const;

export function assertJapan2026Baseline(trip: Trip): void {
  const activityCount = trip.itinerary.reduce((sum, day) => sum + day.activities.length, 0);
  const checks: Array<[boolean, string]> = [
    [trip.id === japan2026Baseline.tripId, "tripId"],
    [trip.startDate === japan2026Baseline.startDate && trip.endDate === japan2026Baseline.endDate, "fechas"],
    [trip.itinerary.length === japan2026Baseline.dayCount, "20 días"],
    [activityCount === japan2026Baseline.activityCount, `${japan2026Baseline.activityCount} actividades`],
    [japan2026Baseline.baseIds.every((id) => trip.bases.some((base) => base.id === id)), "bases"],
    [trip.flightSegments.length === 0, "vuelos pendientes de confirmar"],
    [japan2026Baseline.participantIds.every((id) => trip.participants.some((p) => p.id === id)), "participantes"],
    [trip.achievements.length === japan2026Baseline.stampCount, "sellos"],
    [trip.reservations.length === japan2026Baseline.reservationCount, "reservas"],
    [trip.expenses.length === 0, "gastos"],
    [trip.photos.length === 0, "fotos iniciales"],
    [trip.bases.find((base) => base.id === "tokyo")?.area === "Shiinamachi / Toshima", "base Tokio"],
  ];
  const failed = checks.find(([valid]) => !valid);
  if (failed) throw new Error(`japan-2026: snapshot lógico no coincide en ${failed[1]}.`);
}
