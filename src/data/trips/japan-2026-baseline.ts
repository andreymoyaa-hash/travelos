import type { Trip } from "@/types/travel";
export const japan2026Baseline = {
  tripId:"japan-2026", startDate:"2026-11-09", endDate:"2026-11-30", dayCount:22, activityCount:149,
  baseIds:["osaka","kyoto","tokyo"],
  flightIds:["am0691-2026-11-09","am0058-mex-pvr-2026-11-09","am0058-pvr-nrt-2026-11-10","am0057-2026-11-30","am0656-2026-11-30"],
  participantIds:["andy","jose"], stampCount:20, reservationCount:3, expenseCount:0, photoCount:0,
  osakaAddress:"3-chōme-11-9 Motomachi, Naniwa Ward, Osaka, Osaka 556-0016, Japón",
} as const;
export function assertJapan2026Baseline(trip: Trip): void {
  const activityCount = trip.itinerary.reduce((sum, day) => sum + day.activities.length, 0);
  const checks: Array<[boolean,string]> = [
    [trip.id===japan2026Baseline.tripId,"tripId"],
    [trip.startDate===japan2026Baseline.startDate && trip.endDate===japan2026Baseline.endDate,"fechas"],
    [trip.itinerary.length===japan2026Baseline.dayCount,"22 días"],
    [activityCount===japan2026Baseline.activityCount,`${japan2026Baseline.activityCount} actividades`],
    [japan2026Baseline.baseIds.every((id)=>trip.bases.some((base)=>base.id===id)),"bases"],
    [japan2026Baseline.flightIds.every((id)=>trip.flightSegments.some((flight)=>flight.id===id)),"vuelos"],
    [japan2026Baseline.participantIds.every((id)=>trip.participants.some((p)=>p.id===id)),"participantes"],
    [trip.achievements.length===japan2026Baseline.stampCount,"sellos"],
    [trip.reservations.length===japan2026Baseline.reservationCount,"reservas"],
    [trip.expenses.length===0,"gastos"],[trip.photos.length===0,"fotos iniciales"],
    [trip.bases.find((base)=>base.id==="osaka")?.location.address===japan2026Baseline.osakaAddress,"hospedaje Osaka"],
  ];
  const failed=checks.find(([valid])=>!valid); if(failed) throw new Error(`japan-2026: snapshot lógico no coincide en ${failed[1]}.`);
}
