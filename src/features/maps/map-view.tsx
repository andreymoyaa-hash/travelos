"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  ExternalLink,
  Footprints,
  LocateFixed,
  MapPinned,
  Navigation,
  Route,
  Search,
  TrainFront,
  Zap,
} from "lucide-react";

import { SectionHeading } from "@/components/ui/section-heading";
import type { GoogleMapPoint, GoogleRouteRequest, GoogleRouteSummary } from "@/features/maps/google-map";
import type { GeoPosition, LocationStatus, RouteOption, Trip, TripLocation } from "@/types/travel";

const GoogleMap = dynamic(() => import("@/features/maps/google-map"), {
  ssr: false,
  loading: () => <div className="map-loading"><span /><strong>Cargando Google Maps…</strong></div>,
});

interface MapViewProps {
  trip: Trip;
  position?: GeoPosition;
  locationStatus: LocationStatus;
  locationError?: string;
  savedPlaces: TripLocation[];
  onRequestLocation: () => Promise<GeoPosition | undefined>;
  onSavePlace: (place: TripLocation) => void;
}

const routeIcons = {
  fastest: Zap,
  cheapest: BadgeDollarSign,
  walking: Footprints,
};

const regionByCountry = { japan: "jp", mexico: "mx", korea: "kr", usa: "us", other: undefined } as const;

const hasCoordinates = (location: TripLocation) => location.latitude !== null && location.longitude !== null;

const createGoogleMapsUrl = (origin: GeoPosition, destination: TripLocation) => {
  const query = new URLSearchParams({
    api: "1",
    origin: `${origin.latitude},${origin.longitude}`,
    destination: destination.latitude !== null && destination.longitude !== null ? `${destination.latitude},${destination.longitude}` : destination.name,
    travelmode: "transit",
  });
  if (destination.placeId) query.set("destination_place_id", destination.placeId);
  return `https://www.google.com/maps/dir/?${query.toString()}`;
};

export function MapView({ trip, position, locationStatus, locationError, savedPlaces, onRequestLocation, onSavePlace }: MapViewProps) {
  const [selectedRoute, setSelectedRoute] = useState<RouteOption["id"]>("fastest");
  const [selectedDayId, setSelectedDayId] = useState(trip.itinerary[0].id);
  const [destination, setDestination] = useState<TripLocation>();
  const [routeRequest, setRouteRequest] = useState<GoogleRouteRequest>();
  const [routeResult, setRouteResult] = useState<GoogleRouteSummary>();
  const [routeError, setRouteError] = useState<string>();
  const [preparingRoute, setPreparingRoute] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();
  const selectedDay = trip.itinerary.find((day) => day.id === selectedDayId) ?? trip.itinerary[0];
  const requesting = locationStatus === "requesting";
  const currentRoute = trip.routeOptions.find((route) => route.id === selectedRoute) ?? trip.routeOptions[0];

  const points = useMemo<GoogleMapPoint[]>(() => [
    ...trip.bases.map((base) => ({ id: `base-${base.id}`, label: `Base · ${base.city}`, location: base.location, kind: "base" as const })),
    ...selectedDay.activities.map((activity) => ({ id: activity.id, label: activity.title, location: activity.location, kind: "activity" as const })),
    ...savedPlaces.map((place, index) => ({ id: place.placeId ?? `saved-${index}-${place.name}`, label: place.name, location: place, kind: "saved" as const })),
  ], [savedPlaces, selectedDay.activities, trip.bases]);

  const validPointCount = points.filter((point) => hasCoordinates(point.location)).length;
  const handlePlaceSelect = (place: TripLocation) => {
    setDestination(place);
    setRouteResult(undefined);
    setRouteError(undefined);
    onSavePlace(place);
  };

  const prepareRoute = () => {
    if (!position || !destination) return;
    setPreparingRoute(true);
    setRouteResult(undefined);
    setRouteError(undefined);
    setRouteRequest({ id: Date.now(), origin: position, destination, preference: selectedRoute });
  };

  const handleRouteResult = (result: GoogleRouteSummary) => {
    setRouteResult(result);
    setRouteError(undefined);
    setPreparingRoute(false);
  };

  const handleRouteError = (message: string) => {
    setRouteError(message);
    setPreparingRoute(false);
  };

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow="Google Maps · datos reales"
        title="Explorar y preparar rutas"
        description="Busca lugares con Google Places, guarda su información verificada y calcula rutas sin estimaciones inventadas."
        action={<button type="button" className="primary-button" disabled={requesting} onClick={() => void onRequestLocation()}><LocateFixed size={18} aria-hidden="true" /> {requesting ? "Buscando…" : "Usar mi ubicación"}</button>}
      />

      <div className="location-status" role="status" aria-live="polite">
        <span className={position ? "location-dot active" : "location-dot"} />
        {position ? (
          <div><strong>Ubicación lista como origen</strong><p>{position.latitude.toFixed(6)}, {position.longitude.toFixed(6)} · precisión aproximada {Math.round(position.accuracy)} m</p></div>
        ) : (
          <div><strong>Ubicación sin compartir</strong><p>{locationError ?? "Pulsa “Usar mi ubicación” para solicitar permiso al navegador. Nunca se solicita automáticamente."}</p></div>
        )}
      </div>

      <div className="map-toolbar surface-card">
        <label>Día visible<select value={selectedDayId} onChange={(event) => setSelectedDayId(event.target.value)}>{trip.itinerary.map((day) => <option value={day.id} key={day.id}>{day.dayNumber} {day.month} · {day.area}</option>)}</select></label>
        <div><MapPinned size={18} aria-hidden="true" /><span><strong>{validPointCount}</strong> ubicaciones verificadas</span><small>{points.length - validPointCount} pendientes de coordenadas o placeId</small></div>
        <div><Search size={18} aria-hidden="true" /><span><strong>{destination?.name ?? "Sin destino"}</strong><small>{destination?.address ?? "Selecciona un resultado real de Google Places"}</small></span></div>
      </div>

      <div className="map-layout google-map-layout">
        <section className="map-canvas google-map-canvas">
          {apiKey ? (
            <GoogleMap
              apiKey={apiKey}
              mapId={mapId}
              position={position}
              points={points}
              regionCode={regionByCountry[trip.countryId]}
              routeRequest={routeRequest}
              onPlaceSelect={handlePlaceSelect}
              onRouteResult={handleRouteResult}
              onRouteError={handleRouteError}
            />
          ) : (
            <div className="google-map-unconfigured" role="status">
              <span><MapPinned size={30} aria-hidden="true" /></span>
              <p className="eyebrow">Configuración pendiente</p>
              <h2>Google Maps aún no está configurado.</h2>
              <p>Agrega la variable <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para habilitar el mapa, Places y rutas reales.</p>
              <small>Travel OS sigue funcionando: GPS, itinerario, reservas y demás módulos permanecen disponibles.</small>
            </div>
          )}
          <button type="button" className="map-location-button" aria-label="Usar mi ubicación y centrar mapa" disabled={requesting} onClick={() => void onRequestLocation()}><LocateFixed size={20} aria-hidden="true" /></button>
        </section>

        <aside className="route-planner-card google-route-planner">
          <header><p className="eyebrow">Preparar ruta real</p><h2><Route size={19} aria-hidden="true" /> {position ? "Tu ubicación" : "Falta origen"}</h2><p>{destination?.name ?? "Busca y selecciona un destino"}</p></header>

          {savedPlaces.length > 0 ? <div className="saved-place-list"><small>Lugares guardados</small>{savedPlaces.map((place) => <button type="button" key={place.placeId ?? place.name} onClick={() => setDestination(place)}><MapPinned size={15} aria-hidden="true" /><span><strong>{place.name}</strong><small>{place.address ?? "Dirección no disponible"}</small></span></button>)}</div> : null}

          <div className="route-option-list">
            {trip.routeOptions.map((route) => {
              const Icon = routeIcons[route.id];
              return (
                <button type="button" key={route.id} className={selectedRoute === route.id ? "route-option active" : "route-option"} onClick={() => { setSelectedRoute(route.id); setRouteResult(undefined); }} aria-pressed={selectedRoute === route.id}>
                  <span className="route-option-icon"><Icon size={18} aria-hidden="true" /></span>
                  <span><strong>{route.label}</strong><small>{route.description}</small></span>
                  <span>{selectedRoute === route.id ? "Elegida" : ""}</span>
                </button>
              );
            })}
          </div>

          {routeResult ? (
            <div className="real-route-result" aria-live="polite">
              <div><span><small>Tiempo</small><strong>{routeResult.duration}</strong></span><span><small>Distancia</small><strong>{routeResult.distance}</strong></span></div>
              <div><span><small>Transporte</small><strong><TrainFront size={15} /> Público</strong></span><span><small>Transbordos</small><strong>{routeResult.transfers ?? "No disponible"}</strong></span></div>
              <div><span><small>Tarifa</small><strong>{routeResult.fare ?? "Tarifa no disponible"}</strong></span><span><small>Caminata</small><strong>{routeResult.walkingDistance ?? "No disponible"}</strong></span></div>
              {routeResult.message ? <p>{routeResult.message}</p> : null}
              {routeResult.warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          ) : <div className="route-ready-state"><Navigation size={22} aria-hidden="true" /><div><strong>{currentRoute.label}</strong><p>Tiempo, distancia, transbordos, tarifa y caminata aparecerán sólo si Google los proporciona.</p></div></div>}

          {routeError ? <p className="route-error" role="alert">{routeError}</p> : null}
          <button type="button" className="primary-button full-width" disabled={!apiKey || !position || !destination || preparingRoute} onClick={prepareRoute}><Navigation size={18} aria-hidden="true" /> {preparingRoute ? "Calculando…" : "Calcular ruta"}</button>
          {position && destination ? <a className="secondary-button full-width google-maps-link" href={createGoogleMapsUrl(position, destination)} target="_blank" rel="noreferrer">Abrir en Google Maps <ExternalLink size={16} aria-hidden="true" /></a> : null}
          {!apiKey ? <p className="configuration-note"><MapPinned size={14} aria-hidden="true" /> Places y Routes se activarán al configurar la key restringida.</p> : null}
        </aside>
      </div>
    </div>
  );
}
