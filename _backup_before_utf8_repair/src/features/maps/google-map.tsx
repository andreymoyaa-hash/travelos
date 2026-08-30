"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";

import type { GeoPosition, RouteOption, TripLocation } from "@/types/travel";

let loaderConfigured = false;

export interface GoogleMapPoint {
  id: string;
  label: string;
  location: TripLocation;
  kind: "base" | "activity" | "saved";
}

export interface GoogleRouteRequest {
  id: number;
  origin: GeoPosition;
  destination: TripLocation;
  preference: RouteOption["id"];
}

export interface GoogleRouteSummary {
  duration: string;
  distance: string;
  fare: string | null;
  walkingDistance: string | null;
  transfers: number | null;
  message: string | null;
  warnings: string[];
}

interface GoogleMapProps {
  apiKey: string;
  mapId?: string;
  position?: GeoPosition;
  points: GoogleMapPoint[];
  regionCode?: string;
  routeRequest?: GoogleRouteRequest;
  onPlaceSelect: (place: TripLocation) => void;
  onRouteResult: (result: GoogleRouteSummary) => void;
  onRouteError: (message: string) => void;
}

const toLatLng = (location: TripLocation) => location.latitude !== null && location.longitude !== null
  ? { lat: location.latitude, lng: location.longitude }
  : undefined;

const walkingMeters = (route: google.maps.routes.Route) => route.legs?.reduce((total, leg) => total + leg.steps.reduce(
  (legTotal, step) => legTotal + (step.travelMode === "WALKING" ? step.distanceMeters : 0),
  0,
), 0) ?? null;

const transitSteps = (route: google.maps.routes.Route) => route.legs?.reduce((total, leg) => total + leg.steps.filter((step) => step.travelMode === "TRANSIT").length, 0) ?? null;

const formatDistance = (meters: number) => meters >= 1000
  ? `${(meters / 1000).toLocaleString("es-CR", { maximumFractionDigits: 1 })} km`
  : `${Math.round(meters)} m`;

const fareValue = (route: google.maps.routes.Route) => {
  const fare = route.travelAdvisory?.transitFare;
  return fare ? fare.units + fare.nanos / 1_000_000_000 : undefined;
};

const formatFare = (route: google.maps.routes.Route) => route.travelAdvisory?.transitFare?.toString() ?? null;

function chooseRoute(routes: google.maps.routes.Route[], preference: RouteOption["id"]) {
  const fastest = routes.reduce((best, route) => (route.durationMillis ?? Number.POSITIVE_INFINITY) < (best.durationMillis ?? Number.POSITIVE_INFINITY) ? route : best);

  if (preference === "cheapest") {
    const currency = routes[0].travelAdvisory?.transitFare?.currencyCode;
    const comparable = routes.filter((route) => route.travelAdvisory?.transitFare?.currencyCode === currency && fareValue(route) !== undefined);
    if (currency && comparable.length > 1) {
      return {
        route: comparable.reduce((best, route) => (fareValue(route) ?? Number.POSITIVE_INFINITY) < (fareValue(best) ?? Number.POSITIVE_INFINITY) ? route : best),
        message: null,
      };
    }
    return { route: fastest, message: "No hay suficientes datos de tarifa para comparar estas rutas." };
  }

  if (preference === "walking") {
    const comparable = routes.filter((route) => walkingMeters(route) !== null);
    if (comparable.length > 0) {
      return {
        route: comparable.reduce((best, route) => (walkingMeters(route) ?? Number.POSITIVE_INFINITY) < (walkingMeters(best) ?? Number.POSITIVE_INFINITY) ? route : best),
        message: null,
      };
    }
    return { route: fastest, message: "Google Maps no devolvió segmentos suficientes para comparar la caminata." };
  }

  return { route: fastest, message: null };
}

export default function GoogleMap({ apiKey, mapId, position, points, regionCode, routeRequest, onPlaceSelect, onRouteResult, onRouteError }: GoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerClassRef = useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const routePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onRouteResultRef = useRef(onRouteResult);
  const onRouteErrorRef = useRef(onRouteError);
  const initialPointsRef = useRef(points);
  const initialPositionRef = useRef(position);
  const [readyVersion, setReadyVersion] = useState(0);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
    onRouteResultRef.current = onRouteResult;
    onRouteErrorRef.current = onRouteError;
  }, [onPlaceSelect, onRouteError, onRouteResult]);

  useEffect(() => {
    if (!mapContainerRef.current || !autocompleteHostRef.current) return;
    let disposed = false;
    let autocomplete: google.maps.places.PlaceAutocompleteElement | undefined;

    if (!loaderConfigured) {
      setOptions({ key: apiKey, v: "weekly", language: "es", authReferrerPolicy: "origin" });
      loaderConfigured = true;
    }

    void Promise.all([importLibrary("maps"), importLibrary("marker"), importLibrary("places")]).then(([mapsLibrary, markerLibrary, placesLibrary]) => {
      if (disposed || !mapContainerRef.current || !autocompleteHostRef.current) return;
      const initialPoint = initialPointsRef.current.map((point) => toLatLng(point.location)).find(Boolean);
      const initialPosition = initialPositionRef.current;
      const map = new mapsLibrary.Map(mapContainerRef.current, {
        center: initialPosition ? { lat: initialPosition.latitude, lng: initialPosition.longitude } : initialPoint ?? { lat: 36, lng: 138 },
        zoom: initialPosition || initialPoint ? 13 : 5,
        mapId: mapId || "DEMO_MAP_ID",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      autocomplete = new placesLibrary.PlaceAutocompleteElement({
        includedRegionCodes: regionCode ? [regionCode] : null,
        placeholder: "Buscar estación, hotel, restaurante o lugar",
      });
      autocomplete.setAttribute("aria-label", "Buscar destino con Google Places");
      autocomplete.addEventListener("gmp-select", async (event) => {
        const prediction = (event as google.maps.places.PlacePredictionSelectEvent).placePrediction;
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location"] });
        if (!place.location) return;
        const selected: TripLocation = {
          name: place.displayName ?? prediction.text.toString(),
          address: place.formattedAddress ?? null,
          latitude: place.location.lat(),
          longitude: place.location.lng(),
          placeId: place.id ?? null,
        };
        map.setCenter(place.location);
        map.setZoom(16);
        onPlaceSelectRef.current(selected);
      });
      autocompleteHostRef.current.replaceChildren(autocomplete);
      mapRef.current = map;
      markerClassRef.current = markerLibrary.AdvancedMarkerElement;
      setReadyVersion((version) => version + 1);
    }).catch(() => onRouteErrorRef.current("No se pudo cargar Google Maps. Revisa la API key y las APIs habilitadas."));

    return () => {
      disposed = true;
      autocomplete?.remove();
      markersRef.current.forEach((marker) => { marker.map = null; });
      routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      markersRef.current = [];
      routePolylinesRef.current = [];
      markerClassRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey, mapId, regionCode]);

  useEffect(() => {
    const map = mapRef.current;
    const AdvancedMarkerElement = markerClassRef.current;
    if (!map || !AdvancedMarkerElement) return;
    markersRef.current.forEach((marker) => { marker.map = null; });
    const validPoints = points.flatMap((point) => {
      const coordinates = toLatLng(point.location);
      return coordinates ? [{ ...point, coordinates }] : [];
    });
    const nextMarkers = validPoints.map((point) => new AdvancedMarkerElement({ map, position: point.coordinates, title: point.label }));
    if (position) {
      nextMarkers.push(new AdvancedMarkerElement({ map, position: { lat: position.latitude, lng: position.longitude }, title: "Tu ubicación actual" }));
    }
    markersRef.current = nextMarkers;
  }, [points, position, readyVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!position || !map) return;
    map.panTo({ lat: position.latitude, lng: position.longitude });
    map.setZoom(15);
  }, [position, readyVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!routeRequest || !map) return;
    let disposed = false;
    const destination = toLatLng(routeRequest.destination);
    if (!destination) return;

    void importLibrary("routes").then(async ({ Route }) => {
      const transitPreference = routeRequest.preference === "walking" ? { routingPreference: "LESS_WALKING" as const } : undefined;
      const { routes } = await Route.computeRoutes({
        origin: { lat: routeRequest.origin.latitude, lng: routeRequest.origin.longitude },
        destination,
        travelMode: "TRANSIT",
        transitPreference,
        computeAlternativeRoutes: true,
        fields: ["path", "legs", "distanceMeters", "durationMillis", "travelAdvisory", "localizedValues", "viewport", "warnings"],
      });
      if (disposed) return;
      if (!routes?.length) throw new Error("No routes");

      const selection = chooseRoute(routes, routeRequest.preference);
      const route = selection.route;
      routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      const routeColor = getComputedStyle(mapContainerRef.current!).getPropertyValue("--secondary").trim() || "#2D4665";
      routePolylinesRef.current = route.createPolylines({ polylineOptions: (defaults) => ({ ...defaults, strokeColor: routeColor, strokeOpacity: 0.9, strokeWeight: 6 }) });
      routePolylinesRef.current.forEach((polyline) => polyline.setMap(map));
      if (route.viewport) map.fitBounds(route.viewport, 52);

      const walking = walkingMeters(route);
      const transitCount = transitSteps(route);
      onRouteResultRef.current({
        duration: route.localizedValues?.duration ?? "No disponible",
        distance: route.localizedValues?.distance ?? (route.distanceMeters !== undefined ? formatDistance(route.distanceMeters) : "No disponible"),
        fare: formatFare(route),
        walkingDistance: walking !== null ? formatDistance(walking) : null,
        transfers: transitCount !== null ? Math.max(0, transitCount - 1) : null,
        message: selection.message,
        warnings: route.warnings ?? [],
      });
    }).catch(() => onRouteErrorRef.current("Google Maps no pudo calcular una ruta de transporte público para este origen y destino."));

    return () => { disposed = true; };
  }, [readyVersion, routeRequest]);

  return (
    <div className="google-map-shell">
      <div className="google-places-host" ref={autocompleteHostRef} />
      <div className="google-map" ref={mapContainerRef} aria-label="Mapa interactivo de Google Maps" />
    </div>
  );
}
