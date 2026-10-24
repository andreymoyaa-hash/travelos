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

export interface GoogleDayRouteSummary {
  legs: number;
  failedLegs: number;
  duration: string;
  distance: string;
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
  onDayRouteResult: (result: GoogleDayRouteSummary | undefined) => void;
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

export default function GoogleMap({ apiKey, mapId, position, points, regionCode, routeRequest, onPlaceSelect, onRouteResult, onDayRouteResult, onRouteError }: GoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerClassRef = useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const routePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const dayRoutePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const [resolvedCoordinates, setResolvedCoordinates] = useState<Record<string, { lat: number; lng: number }>>({});
  const [loadError, setLoadError] = useState<string>();
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onRouteResultRef = useRef(onRouteResult);
  const onDayRouteResultRef = useRef(onDayRouteResult);
  const onRouteErrorRef = useRef(onRouteError);
  const initialPointsRef = useRef(points);
  const initialPositionRef = useRef(position);
  const [readyVersion, setReadyVersion] = useState(0);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
    onRouteResultRef.current = onRouteResult;
    onDayRouteResultRef.current = onDayRouteResult;
    onRouteErrorRef.current = onRouteError;
  }, [onDayRouteResult, onPlaceSelect, onRouteError, onRouteResult]);

  useEffect(() => {
    if (!mapContainerRef.current || !autocompleteHostRef.current) return;
    let disposed = false;
    let autocomplete: google.maps.places.PlaceAutocompleteElement | undefined;

    if (!loaderConfigured) {
      setOptions({ key: apiKey, v: "weekly", language: "es", authReferrerPolicy: "origin" });
      loaderConfigured = true;
    }

    setLoadError(undefined);
    void Promise.all([importLibrary("maps"), importLibrary("marker"), importLibrary("places"), importLibrary("geocoding")]).then(([mapsLibrary, markerLibrary, placesLibrary, geocodingLibrary]) => {
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
      geocoderRef.current = new geocodingLibrary.Geocoder();
      setReadyVersion((version) => version + 1);
    }).catch((error) => {
      const detail = error instanceof Error ? error.message : String(error ?? "");
      const message = detail
        ? `No se pudo cargar Google Maps: ${detail}`
        : "No se pudo cargar Google Maps. Revisa la API key, restricciones de dominio y APIs habilitadas.";
      setLoadError(message);
      onRouteErrorRef.current(message);
    });

    return () => {
      disposed = true;
      autocomplete?.remove();
      markersRef.current.forEach((marker) => { marker.map = null; });
      routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      dayRoutePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      markersRef.current = [];
      routePolylinesRef.current = [];
      dayRoutePolylinesRef.current = [];
      markerClassRef.current = null;
      geocoderRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey, mapId, regionCode]);

  useEffect(() => {
    const geocoder = geocoderRef.current;
    if (!geocoder || !readyVersion) return;
    let disposed = false;

    const unresolved = points.filter((point) => !toLatLng(point.location) && !resolvedCoordinates[point.id]);
    if (!unresolved.length) return;

    void (async () => {
      const next: Record<string, { lat: number; lng: number }> = {};
      for (const point of unresolved) {
        if (disposed) return;
        const query = point.location.address?.trim() || point.location.name?.trim() || point.label;
        if (!query) continue;
        try {
          const response = await geocoder.geocode({
            address: query,
            region: regionCode,
          });
          const result = response.results?.[0];
          const location = result?.geometry?.location;
          if (location) next[point.id] = { lat: location.lat(), lng: location.lng() };
        } catch {
          // A missing geocode should not break the entire map. Search still lets the user pick a verified place.
        }
      }
      if (!disposed && Object.keys(next).length) {
        setResolvedCoordinates((current) => ({ ...current, ...next }));
      }
    })();

    return () => { disposed = true; };
  }, [points, readyVersion, regionCode, resolvedCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    const AdvancedMarkerElement = markerClassRef.current;
    if (!map || !AdvancedMarkerElement) return;
    markersRef.current.forEach((marker) => { marker.map = null; });
    const validPoints = points.flatMap((point) => {
      const coordinates = toLatLng(point.location) ?? resolvedCoordinates[point.id];
      return coordinates ? [{ ...point, coordinates }] : [];
    });
    const nextMarkers = validPoints.map((point) => new AdvancedMarkerElement({ map, position: point.coordinates, title: point.label }));
    if (position) {
      nextMarkers.push(new AdvancedMarkerElement({ map, position: { lat: position.latitude, lng: position.longitude }, title: "Tu ubicación actual" }));
    }
    markersRef.current = nextMarkers;
  }, [points, position, readyVersion, resolvedCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyVersion) return;

    const activityPoints = points
      .filter((point) => point.kind === "activity")
      .map((point) => ({
        ...point,
        coordinates: toLatLng(point.location) ?? resolvedCoordinates[point.id],
      }))
      .filter((point): point is GoogleMapPoint & { coordinates: { lat: number; lng: number } } => Boolean(point.coordinates));

    dayRoutePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    dayRoutePolylinesRef.current = [];
    onDayRouteResultRef.current(undefined);

    if (activityPoints.length < 2) return;

    let disposed = false;
    void importLibrary("routes").then(async ({ Route }) => {
      let totalDistance = 0;
      let totalDuration = 0;
      let successfulLegs = 0;
      let failedLegs = 0;
      const allPolylines: google.maps.Polyline[] = [];
      const bounds = new google.maps.LatLngBounds();

      for (let index = 0; index < activityPoints.length - 1; index += 1) {
        if (disposed) return;
        const origin = activityPoints[index].coordinates;
        const destination = activityPoints[index + 1].coordinates;
        bounds.extend(origin);
        bounds.extend(destination);

        try {
          const { routes } = await Route.computeRoutes({
            origin,
            destination,
            travelMode: "TRANSIT",
            computeAlternativeRoutes: false,
            fields: ["path", "distanceMeters", "durationMillis", "viewport"],
          });
          const route = routes?.[0];
          if (!route) {
            failedLegs += 1;
            continue;
          }

          successfulLegs += 1;
          totalDistance += route.distanceMeters ?? 0;
          totalDuration += route.durationMillis ?? 0;
          const routeColor = getComputedStyle(mapContainerRef.current!).getPropertyValue("--secondary").trim() || "#2D4665";
          const polylines = route.createPolylines({
            polylineOptions: (defaults) => ({
              ...defaults,
              strokeColor: routeColor,
              strokeOpacity: 0.82,
              strokeWeight: 5,
            }),
          });
          polylines.forEach((polyline) => {
            polyline.setMap(map);
            allPolylines.push(polyline);
          });
        } catch {
          failedLegs += 1;
        }
      }

      if (disposed) {
        allPolylines.forEach((polyline) => polyline.setMap(null));
        return;
      }

      dayRoutePolylinesRef.current = allPolylines;
      if (!bounds.isEmpty()) map.fitBounds(bounds, 52);

      if (successfulLegs > 0) {
        const totalMinutes = Math.max(1, Math.round(totalDuration / 60000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        onDayRouteResultRef.current({
          legs: successfulLegs,
          failedLegs,
          duration: hours ? `${hours} h ${minutes} min` : `${minutes} min`,
          distance: formatDistance(totalDistance),
        });
      } else {
        onRouteErrorRef.current("No se pudieron calcular las rutas del día. Verifica que Routes API esté habilitada para la clave de Google Maps.");
      }
    }).catch((error) => {
      if (disposed) return;
      const detail = error instanceof Error ? error.message : "";
      onRouteErrorRef.current(detail
        ? `Google Routes no pudo iniciar: ${detail}`
        : "Google Routes no pudo iniciar. Verifica que Routes API esté habilitada.");
    });

    return () => {
      disposed = true;
      dayRoutePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      dayRoutePolylinesRef.current = [];
    };
  }, [points, readyVersion, resolvedCoordinates]);

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
      {loadError ? (
        <div className="google-map-unconfigured" role="alert">
          <p className="eyebrow">Google Maps no pudo iniciar</p>
          <h2>Revisa la configuración de Google Maps</h2>
          <p>{loadError}</p>
          <small>La API key está configurada en NIOLI. Si aparece un error de autorización, revisa que nioli.vercel.app esté permitido en las restricciones HTTP del API key y que Maps JavaScript API + Places API estén habilitadas.</small>
        </div>
      ) : null}
      <div className="google-map" ref={mapContainerRef} aria-label="Mapa interactivo de Google Maps" />
    </div>
  );
}
