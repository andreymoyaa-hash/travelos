import { ArrowRight, Clock3, Plane, Timer, Waypoints } from "lucide-react";

import type { FlightEndpoint, FlightSegment } from "@/types/travel";

const friendlyTimeZone: Record<string, string> = {
  "America/Costa_Rica": "Hora Costa Rica",
  "America/Mexico_City": "Hora Ciudad de México",
  "Asia/Tokyo": "Hora Japón",
};

const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const getDateLabel = (endpoint: FlightEndpoint) => {
  const [date] = endpoint.dateTime.split("T");
  const monthIndex = Number(date.slice(5, 7)) - 1;
  return `${date.slice(8, 10)} ${monthLabels[monthIndex]}`;
};

const getLocalTime = (endpoint: FlightEndpoint) => endpoint.dateTime.slice(11, 16);

const getCalendarDayDifference = (departure: FlightEndpoint, arrival: FlightEndpoint) => {
  const departureDay = Date.parse(`${departure.dateTime.slice(0, 10)}T00:00:00Z`);
  const arrivalDay = Date.parse(`${arrival.dateTime.slice(0, 10)}T00:00:00Z`);
  return Math.round((arrivalDay - departureDay) / 86400000);
};

const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

export function FlightCard({ flight, compact = false }: { flight: FlightSegment; compact?: boolean }) {
  const arrivalDayDifference = getCalendarDayDifference(flight.departure, flight.arrival);

  return (
    <article className={compact ? "flight-card compact" : "flight-card"}>
      <header className="flight-card-header">
        <div className="flight-brand"><span><Plane size={20} aria-hidden="true" /></span><div><small>{flight.airline}</small><strong>{flight.flightNumber}</strong></div></div>
        <span className="aircraft-badge">{flight.aircraft}</span>
      </header>

      <div className="flight-route" aria-label={`${flight.departure.airportCode} a ${flight.arrival.airportCode}`}>
        <FlightStop endpoint={flight.departure} label="Salida" />
        <div className="flight-route-line" aria-hidden="true"><i /><Plane size={18} /><ArrowRight size={16} /><i /></div>
        <FlightStop endpoint={flight.arrival} label="Llegada" arrivalDayDifference={arrivalDayDifference} align="right" />
      </div>

      <div className="flight-facts">
        <span><Timer size={15} aria-hidden="true" /><small>Duración</small><strong>{formatDuration(flight.durationMinutes)}</strong></span>
        <span><Waypoints size={15} aria-hidden="true" /><small>Terminal llegada</small><strong>{flight.arrival.terminal ?? "No disponible"}</strong></span>
        <span><Clock3 size={15} aria-hidden="true" /><small>{flight.layoverAfter ? "Escala" : "Fecha de llegada"}</small><strong>{flight.layoverAfter ? `${flight.layoverAfter.city} · ${formatDuration(flight.layoverAfter.durationMinutes)}` : `${getDateLabel(flight.arrival)} · ${friendlyTimeZone[flight.arrival.timezone] ?? `Hora ${flight.arrival.city}`}`}</strong></span>
      </div>
    </article>
  );
}

function FlightStop({ endpoint, label, arrivalDayDifference = 0, align = "left" }: { endpoint: FlightEndpoint; label: string; arrivalDayDifference?: number; align?: "left" | "right" }) {
  return (
    <div className={`flight-stop ${align}`}>
      <small>{label} · {getDateLabel(endpoint)}</small>
      <strong>{endpoint.airportCode}</strong>
      <span>{endpoint.city}</span>
      <time dateTime={endpoint.dateTime}>{getLocalTime(endpoint)}{arrivalDayDifference > 0 ? <sup>+{arrivalDayDifference} días</sup> : null}</time>
      <em>{friendlyTimeZone[endpoint.timezone] ?? `Hora ${endpoint.city}`}</em>
    </div>
  );
}
