"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef, useState } from "react";

import type { GeoPosition, RouteOption, TripLocation } from "@/types/travel";

let loaderConfigured = false;

export interface GoogleMapPoint {
  id: string;
  label: string;
  location: TripLocation;
  kind: "base" | "activity" | "saved";
  query?: string;
  routeable?: boolean;
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

type LatLng = { lat: number; lng: number };

const toLatLng = (location: TripLocation): LatLng | undefined =>
  location.latitude !== null && location.longitude !== null
    ? { lat: location.latitude, lng: location.longitude }
    : undefined;

const formatDistance = (meters: number) =>
  meters >= 1000
    ? `${(meters / 1000).toLocaleString("es-CR", { maximumFractionDigits: 1 })} km`
    : `${Math.round(meters)} m`;

const formatDuration = (milliseconds: number) => {
  const totalMinutes = Math.max(1, Math.round(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
};

const cleanQuery = (value: string) =>
  value
    .replace(/\s*·\s*(desayuno|agua|snacks|higiene).*$/i, "")
    .replace(/\s+si queda energía$/i, "")
    .replace(/\s+opcional$/i, "")
    .replace(/\s+nocturno$/i, "")
    .trim();

export default function GoogleMap({
  apiKey,
  mapId,
  position,
  points,
  regionCode,
  routeRequest,
  onPlaceSelect,
  onRouteResult,
  onDayRouteResult,
  onRouteError,
}: GoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerClassRef = useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const dayRoutePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const userRoutePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onRouteResultRef = useRef(onRouteResult);
  const onDayRouteResultRef = useRef(onDayRouteResult);
  const onRouteErrorRef = useRef(onRouteError);
  const [readyVersion, setReadyVersion] = useState(0);
  const [resolvedPlaces, setResolvedPlaces] = useState<Record<string, google.maps.places.Place>>({});

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

    void Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("places"),
    ]).then(([mapsLibrary, markerLibrary, placesLibrary]) => {
      if (disposed || !mapContainerRef.current || !autocompleteHostRef.current) return;

      const firstCoordinate = points.map((point) => toLatLng(point.location)).find(Boolean);
      const map = new mapsLibrary.Map(mapContainerRef.current, {
        center: position
          ? { lat: position.latitude, lng: position.longitude }
          : firstCoordinate ?? { lat: 36.2048, lng: 138.2529 },
        zoom: position || firstCoordinate ? 13 : 5,
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
    }).catch((error) => {
      const detail = error instanceof Error ? error.message : String(error ?? "");
      onRouteErrorRef.current(detail
        ? `Google Maps no pudo iniciar: ${detail}`
        : "Google Maps no pudo iniciar.");
    });

    return () => {
      disposed = true;
      autocomplete?.remove();
      markersRef.current.forEach((marker) => { marker.map = null; });
      dayRoutePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      userRoutePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      markersRef.current = [];
      dayRoutePolylinesRef.current = [];
      userRoutePolylinesRef.current = [];
      mapRef.current = null;
      markerClassRef.current = null;
    };
  }, [apiKey, mapId, position, regionCode]);

  const routeablePoints = useMemo(
    () => points.filter((point) => point.kind === "activity" && point.routeable !== false),
    [points],
  );

  useEffect(() => {
    if (!readyVersion) return;
    let disposed = false;

    void importLibrary("places").then(async ({ Place }) => {
      const next: Record<string, google.maps.places.Place> = {};
      for (const point of points) {
        if (disposed || resolvedPlaces[point.id]) continue;

        const direct = toLatLng(point.location);
        if (direct) {
          const place = new Place({ id: point.location.placeId ?? point.id });
          Object.defineProperty(place, "location", { value: new google.maps.LatLng(direct), configurable: true });
          next[point.id] = place;
          continue;
        }

        const raw = point.query ?? point.location.address ?? point.location.name ?? point.label;
        const textQuery = regionCode === "jp" ? `${cleanQuery(raw)}, Japan` : cleanQuery(raw);
        if (!textQuery) continue;

        try {
          const { places } = await Place.searchByText({
            textQuery,
            fields: ["id", "displayName", "formattedAddress", "location"],
            maxResultCount: 1,
            region: regionCode,
          });
          if (places?.[0]?.location) next[point.id] = places[0];
        } catch (error) {
          console.warn("NIOLI Places lookup failed", point.label, error);
        }
      }
      if (!disposed && Object.keys(next).length) {
        setResolvedPlaces((current) => ({ ...current, ...next }));
      }
    }).catch((error) => {
      const detail = error instanceof Error ? error.message : String(error ?? "");
      onRouteErrorRef.current(detail
        ? `Google Places no pudo iniciar: ${detail}`
        : "Google Places no pudo iniciar.");
    });

    return () => { disposed = true; };
  }, [points, readyVersion, regionCode, resolvedPlaces]);

  useEffect(() => {
    const map = mapRef.current;
    const AdvancedMarkerElement = markerClassRef.current;
    if (!map || !AdvancedMarkerElement) return;

    markersRef.current.forEach((marker) => { marker.map = null; });
    const next: google.maps.marker.AdvancedMarkerElement[] = [];

    for (const point of points) {
      const coordinates = toLatLng(point.location) ?? (resolvedPlaces[point.id]?.location
        ? { lat: resolvedPlaces[point.id].location!.lat(), lng: resolvedPlaces[point.id].location!.lng() }
        : undefined);
      if (!coordinates) continue;
      next.push(new AdvancedMarkerElement({ map, position: coordinates, title: point.label }));
    }

    if (position) {
      next.push(new AdvancedMarkerElement({
        map,
        position: { lat: position.latitude, lng: position.longitude },
        title: "Tu ubicación actual",
      }));
    }

    markersRef.current = next;
  }, [points, position, readyVersion, resolvedPlaces]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyVersion) return;

    const stops = routeablePoints
      .map((point) => ({ point, place: resolvedPlaces[point.id] }))
      .filter((item): item is { point: GoogleMapPoint; place: google.maps.places.Place } => Boolean(item.place?.location));

    dayRoutePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    dayRoutePolylinesRef.current = [];
    onDayRouteResultRef.current(undefined);

    if (stops.length < 2) return;

    let disposed = false;
    void importLibrary("routes").then(async ({ Route }) => {
      let totalDistance = 0;
      let totalDuration = 0;
      let successfulLegs = 0;
      let failedLegs = 0;
      const allPolylines: google.maps.Polyline[] = [];
      const bounds = new google.maps.LatLngBounds();

      for (let index = 0; index < stops.length - 1; index += 1) {
        if (disposed) return;
        const origin = stops[index].place;
        const destination = stops[index + 1].place;
        if (!origin.location || !destination.location) continue;

        bounds.extend(origin.location);
        bounds.extend(destination.location);

        let chosen: google.maps.routes.Route | undefined;
        for (const travelMode of ["TRANSIT", "WALKING"] as const) {
          try {
            const { routes } = await Route.computeRoutes({
              origin,
              destination,
              travelMode,
              computeAlternativeRoutes: false,
              fields: ["path", "legs", "distanceMeters", "durationMillis", "localizedValues"],
            });
            if (routes?.[0]) {
              chosen = routes[0];
              break;
            }
          } catch (error) {
            console.warn("NIOLI route leg failed", stops[index].point.label, stops[index + 1].point.label, travelMode, error);
          }
        }

        if (!chosen) {
          failedLegs += 1;
          continue;
        }

        successfulLegs += 1;
        totalDistance += chosen.distanceMeters ?? 0;
        totalDuration += chosen.durationMillis ?? 0;
        const polylines = chosen.createPolylines();
        polylines.forEach((polyline) => {
          polyline.setMap(map);
          allPolylines.push(polyline);
        });
      }

      if (disposed) {
        allPolylines.forEach((polyline) => polyline.setMap(null));
        return;
      }

      dayRoutePolylinesRef.current = allPolylines;
      if (!bounds.isEmpty()) map.fitBounds(bounds, 48);

      if (successfulLegs > 0) {
        onDayRouteResultRef.current({
          legs: successfulLegs,
          failedLegs,
          duration: formatDuration(totalDuration),
          distance: formatDistance(totalDistance),
        });
      } else {
        onRouteErrorRef.current("Google no devolvió ninguna ruta para las paradas de este día.");
      }
    }).catch((error) => {
      const detail = error instanceof Error ? error.message : String(error ?? "");
      onRouteErrorRef.current(detail
        ? `Google Routes no pudo iniciar: ${detail}`
        : "Google Routes no pudo iniciar.");
    });

    return () => {
      disposed = true;
      dayRoutePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      dayRoutePolylinesRef.current = [];
    };
  }, [readyVersion, resolvedPlaces, routeablePoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeRequest) return;
    const destination = toLatLng(routeRequest.destination);
    if (!destination) {
      onRouteErrorRef.current("El destino no tiene coordenadas válidas. Selecciónalo nuevamente desde Google Places.");
      return;
    }

    let disposed = false;
    void importLibrary("routes").then(async ({ Route }) => {
      userRoutePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      userRoutePolylinesRef.current = [];

      const origin = { lat: routeRequest.origin.latitude, lng: routeRequest.origin.longitude };
      const preferredModes = routeRequest.preference === "walking"
        ? (["WALKING"] as const)
        : (["TRANSIT", "WALKING"] as const);

      let chosen: google.maps.routes.Route | undefined;
      let chosenMode: "TRANSIT" | "WALKING" | undefined;
      const errors: string[] = [];

      for (const travelMode of preferredModes) {
        try {
          const { routes } = await Route.computeRoutes({
            origin,
            destination,
            travelMode,
            computeAlternativeRoutes: travelMode === "TRANSIT",
            fields: ["path", "legs", "distanceMeters", "durationMillis", "localizedValues", "warnings", "travelAdvisory"],
          });

          if (routes?.length) {
            if (routeRequest.preference === "cheapest" && travelMode === "TRANSIT") {
              const withFare = routes
                .map((route) => ({ route, fare: route.travelAdvisory?.transitFare }))
                .filter((item) => item.fare);
              chosen = withFare.length ? withFare[0].route : routes[0];
            } else {
              chosen = routes[0];
            }
            chosenMode = travelMode;
            break;
          }
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error ?? "");
          errors.push(`${travelMode}: ${detail || "sin detalle"}`);
        }
      }

      if (disposed) return;
      if (!chosen || !chosenMode) {
        throw new Error(errors.length ? errors.join(" | ") : "Google no devolvió rutas.");
      }

      const polylines = chosen.createPolylines();
      polylines.forEach((polyline) => polyline.setMap(map));
      userRoutePolylinesRef.current = polylines;

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.fitBounds(bounds, 64);

      const fare = chosen.travelAdvisory?.transitFare?.toString?.() ?? null;
      const walkingMeters = chosen.legs?.reduce((total, leg) => total + leg.steps.reduce(
        (legTotal, step) => legTotal + (step.travelMode === "WALKING" ? step.distanceMeters : 0),
        0,
      ), 0) ?? null;
      const transitSteps = chosen.legs?.reduce((total, leg) => total + leg.steps.filter((step) => step.travelMode === "TRANSIT").length, 0) ?? null;

      onRouteResultRef.current({
        duration: chosen.localizedValues?.duration ?? formatDuration(chosen.durationMillis ?? 0),
        distance: chosen.localizedValues?.distance ?? formatDistance(chosen.distanceMeters ?? 0),
        fare,
        walkingDistance: walkingMeters !== null ? formatDistance(walkingMeters) : null,
        transfers: chosenMode === "TRANSIT" && transitSteps !== null ? Math.max(0, transitSteps - 1) : 0,
        message: chosenMode === "WALKING" && routeRequest.preference !== "walking"
          ? "Google no devolvió una ruta de transporte público; se muestra la ruta a pie."
          : null,
        warnings: chosen.warnings ?? [],
      });
    }).catch((error) => {
      const detail = error instanceof Error ? error.message : String(error ?? "");
      onRouteErrorRef.current(detail
        ? `Google no pudo calcular la ruta: ${detail}`
        : "Google no pudo calcular la ruta.");
    });

    return () => { disposed = true; };
  }, [routeRequest]);

  return (
    <div className="google-map-shell">
      <div className="google-places-host" ref={autocompleteHostRef} />
      <div className="google-map" ref={mapContainerRef} aria-label="Mapa interactivo de Google Maps" />
    </div>
  );
}
