import type { Trip } from "@/types/travel";

export const japan2026Baseline = {
  tripId: "japan-2026",
  startDate: "2026-11-09",
  endDate: "2026-11-30",
  dayCount: 22,
  activityCount: 143,
  baseIds: ["osaka", "kyoto", "tokyo"],
  flightIds: ["am0691-2026-11-09", "am0058-2026-11-09"],
  participantIds: ["andy", "jose"],
  stampCount: 20,
  reservationCount: 0,
  expenseCount: 0,
  photoCount: 0,
  osakaAddress: "3-chōme-11-9 Motomachi, Naniwa Ward, Osaka, Osaka 556-0016, Japón",
} as const;

export function assertJapan2026Baseline(trip: Trip): void {
  const activityCount = trip.itinerary.reduce((sum, day) => sum + day.activities.length, 0);
  const checks: Array<[boolean, string]> = [
    [trip.id === japan2026Baseline.tripId, "tripId"],
    [trip.startDate === japan2026Baseline.startDate && trip.endDate === japan2026Baseline.endDate, "fechas"],
    [trip.itinerary.length === japan2026Baseline.dayCount, "22 días"],
    [activityCount === japan2026Baseline.activityCount, "143 actividades"],
    [japan2026Baseline.baseIds.every((id) => trip.bases.some((base) => base.id === id)), "bases"],
    [japan2026Baseline.flightIds.every((id) => trip.flightSegments.some((flight) => flight.id === id)), "vuelos"],
    [japan2026Baseline.participantIds.every((id) => trip.participants.some((participant) => participant.id === id)), "participantes"],
    [trip.achievements.length === japan2026Baseline.stampCount, "sellos"],
    [trip.reservations.length === japan2026Baseline.reservationCount, "reservas pendientes de registrar"],
    [trip.expenses.length === japan2026Baseline.expenseCount, "gastos pendientes de registrar"],
    [trip.photos.length === japan2026Baseline.photoCount, "fotos iniciales"],
    [trip.bases.find((base) => base.id === "osaka")?.location.address === japan2026Baseline.osakaAddress, "hospedaje Osaka"],
  ];
  const failed = checks.find(([valid]) => !valid);
  if (failed) throw new Error(`japan-2026: el snapshot lógico no coincide en ${failed[1]}.`);
}

