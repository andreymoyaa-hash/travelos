"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LocateFixed, MapPin, Navigation, Search, Sparkles } from "lucide-react";

import { SectionHeading } from "@/components/ui/section-heading";
import type { GeoPosition, LocationStatus, RouteOption, Trip } from "@/types/travel";

const LeafletMap = dynamic(() => import("@/features/maps/leaflet-map"), {
  ssr: false,
  loading: () => <div className="map-loading">Cargando mapa…</div>,
});

interface MapViewProps {
  trip: Trip;
  position?: GeoPosition;
  locationStatus: LocationStatus;
  locationError?: string;
  onRequestLocation: () => Promise<GeoPosition | undefined>;
}

export function MapView({ trip, position, locationStatus, locationError, onRequestLocation }: MapViewProps) {
  const [selectedRoute, setSelectedRoute] = useState<RouteOption["id"]>("fastest");
  const [destination, setDestination] = useState("");
  const currentRoute = trip.routeOptions.find((route) => route.id === selectedRoute) ?? trip.routeOptions[0];
  const requesting = locationStatus === "requesting";

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow="Muévete como local"
        title="Explorar mapa"
        description="Consulta el mapa real y usa tu posición sólo cuando tú lo decidas."
        action={<button type="button" className="primary-button" disabled={requesting} onClick={() => void onRequestLocation()}><LocateFixed size={17} /> {requesting ? "Buscando…" : "Usar mi ubicación"}</button>}
      />

      <div className="location-status" role="status" aria-live="polite">
        <span className={position ? "location-dot active" : "location-dot"} />
        {position ? (
          <div><strong>Ubicación actual</strong><p>{position.latitude.toFixed(6)}, {position.longitude.toFixed(6)} · precisión aproximada {Math.round(position.accuracy)} m</p></div>
        ) : (
          <div><strong>Ubicación sin compartir</strong><p>{locationError ?? "Pulsa “Usar mi ubicación” para solicitar permiso al navegador."}</p></div>
        )}
      </div>

      <div className="map-layout">
        <section className="map-canvas">
          <LeafletMap position={position} />
          <div className="map-search"><Search size={17} /><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Destino, estación o experiencia" aria-label="Destino de la ruta" /></div>
          <button type="button" className="map-location-button" aria-label="Usar mi ubicación" disabled={requesting} onClick={() => void onRequestLocation()}><LocateFixed size={19} /></button>
        </section>

        <aside className="route-planner-card">
          <header><p className="eyebrow">Preparar ruta</p><h2><MapPin size={18} /> {position ? "Tu ubicación" : "Elige un origen"}</h2><p>{destination || "Escribe un destino en el mapa"}</p></header>
          <div className="route-option-list">
            {trip.routeOptions.map((route) => (
              <button type="button" key={route.id} className={selectedRoute === route.id ? "route-option active" : "route-option"} onClick={() => setSelectedRoute(route.id)} aria-pressed={selectedRoute === route.id}>
                <span className="route-option-icon">{route.icon}</span>
                <span><strong>{route.label}</strong><small>{route.description}</small></span>
                <span><strong>{selectedRoute === route.id ? "Elegida" : ""}</strong></span>
              </button>
            ))}
          </div>
          <div className="route-ready-state"><Navigation size={22} /><div><strong>{currentRoute.label}</strong><p>La duración, el costo y el trazado aparecerán cuando se conecte un proveedor de rutas; Travel OS no muestra estimaciones ficticias.</p></div></div>
          <button type="button" className="primary-button full-width" disabled={!position || !destination.trim()}><Navigation size={17} /> Preparar navegación</button>
          <p className="future-note"><Sparkles size={14} /> GPS real activo; cálculo guiado de rutas preparado para la siguiente integración.</p>
        </aside>
      </div>
    </div>
  );
}
