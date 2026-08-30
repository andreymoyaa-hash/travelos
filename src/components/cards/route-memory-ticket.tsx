import Image from "next/image";
import { Bus, CarFront, Plane, TrainFront } from "lucide-react";

import { officialRouteArt } from "@/lib/nioli/official-assets";
import type { Trip } from "@/types/travel";

const formatDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date).toUpperCase();
};

const compactRouteLabel = (value: string) => value.replace(/Ciudad de /i, "").slice(0, 14);

export function RouteMemoryTicket({ trip, className = "" }: { trip: Trip; className?: string }) {
  const art = officialRouteArt(trip.countryId);
  const firstFlight = trip.flightSegments[0];
  const lastFlight = trip.flightSegments.at(-1);
  const from = firstFlight?.departure.airportCode ?? compactRouteLabel(trip.route[0] ?? trip.currentCity ?? "ORIGEN");
  const to = lastFlight?.arrival.airportCode ?? compactRouteLabel(trip.route.at(-1) ?? trip.currentCity ?? "DESTINO");
  const travelDate = firstFlight?.departure.dateTime?.slice(0, 10) ?? trip.startDate;

  return (
    <article className={`route-memory-ticket ${className}`.trim()} aria-label={`Recuerdo de ruta ${from} a ${to}`}>
      <div className="route-memory-art">
        {art ? <Image src={art} alt="" fill sizes="(max-width: 720px) 38vw, 270px" /> : <span>{trip.worldClock.destination.countryCode}</span>}
      </div>
      <div className="route-memory-copy">
        <header><span>Recuerdo de ruta</span><strong>{trip.name}</strong></header>
        <div className="route-memory-route"><b>{from}</b><span>→</span><b>{to}</b></div>
        <dl>
          <div><dt>Fecha</dt><dd>{formatDate(travelDate)}</dd></div>
          <div><dt>Viaje</dt><dd>{trip.worldClock.destination.countryCode}</dd></div>
        </dl>
        <div className="route-memory-transport" aria-label="Medios de viaje">
          <Plane size={17} aria-hidden="true" />
          <TrainFront size={17} aria-hidden="true" />
          <Bus size={17} aria-hidden="true" />
          <CarFront size={17} aria-hidden="true" />
        </div>
        <span className="route-memory-barcode" aria-hidden="true" />
      </div>
      <span className="route-memory-seal" aria-hidden="true">NIOLI<br />RUTA</span>
    </article>
  );
}
