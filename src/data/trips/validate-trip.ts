import type { Trip } from "@/types/travel";

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

export function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (cursor <= end) {
    dates.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function assertTripTemplate(trip: Trip): void {
  const expectedDates = enumerateDates(trip.startDate, trip.endDate);
  const actualDates = trip.itinerary.map((day) => day.date);
  const uniqueDates = new Set(actualDates);
  const dayIds = new Set(trip.itinerary.map((day) => day.id));
  const activityIds = trip.itinerary.flatMap((day) => day.activities.map((activity) => activity.id));

  if (actualDates.length !== expectedDates.length || uniqueDates.size !== actualDates.length) {
    throw new Error(`${trip.id}: el itinerario debe contener cada fecha exactamente una vez.`);
  }

  if (expectedDates.some((date) => !uniqueDates.has(date))) {
    throw new Error(`${trip.id}: faltan fechas dentro del rango maestro.`);
  }

  if (dayIds.size !== trip.itinerary.length) {
    throw new Error(`${trip.id}: los IDs de los días deben ser únicos.`);
  }

  if (new Set(activityIds).size !== activityIds.length) {
    throw new Error(`${trip.id}: los IDs de las actividades deben ser únicos.`);
  }

  for (const day of trip.itinerary) {
    if (day.activities.some((activity) => activity.date !== day.date)) {
      throw new Error(`${trip.id}: una actividad tiene una fecha distinta a la de su día.`);
    }
  }
}
