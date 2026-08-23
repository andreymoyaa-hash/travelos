"use client";

import { useEffect, useRef, useState } from "react";

import type { GeoPosition } from "@/types/travel";

interface LeafletMapProps {
  position?: GeoPosition;
}

export default function LeafletMap({ position }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const locationLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const initialPositionRef = useRef(position);
  const tileTimerRef = useRef<number | null>(null);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let disposed = false;

    void import("leaflet").then((leafletModule) => {
      if (disposed || !containerRef.current) return;

      const L = leafletModule.default;
      const map = L.map(containerRef.current, {
        center: [36.2048, 138.2529],
        zoom: 5,
        zoomControl: true,
      });

      const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      tileLayer.on("tileerror", () => setTileError(true));
      tileLayer.on("tileload", () => {
        if (tileTimerRef.current !== null) window.clearTimeout(tileTimerRef.current);
        setTileError(false);
      });
      tileLayer.addTo(map);
      tileTimerRef.current = window.setTimeout(() => setTileError(true), 6000);

      const locationLayer = L.layerGroup().addTo(map);
      mapRef.current = map;
      locationLayerRef.current = locationLayer;

      const initialPosition = initialPositionRef.current;
      if (initialPosition) {
        const coordinates: [number, number] = [initialPosition.latitude, initialPosition.longitude];
        L.circle(coordinates, {
          radius: initialPosition.accuracy,
          color: "#5d4b9b",
          fillColor: "#8b73ca",
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(locationLayer);
        L.circleMarker(coordinates, {
          radius: 8,
          color: "#ffffff",
          fillColor: "#5d4b9b",
          fillOpacity: 1,
          weight: 3,
        }).bindPopup("Tu ubicación actual").addTo(locationLayer);
        map.setView(coordinates, 15);
      }

      window.setTimeout(() => map.invalidateSize(), 0);
    });

    return () => {
      disposed = true;
      if (tileTimerRef.current !== null) window.clearTimeout(tileTimerRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
      locationLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!position || !mapRef.current || !locationLayerRef.current) return;

    void import("leaflet").then((leafletModule) => {
      const map = mapRef.current;
      const layer = locationLayerRef.current;
      if (!map || !layer) return;

      const L = leafletModule.default;
      const coordinates: [number, number] = [position.latitude, position.longitude];
      layer.clearLayers();
      L.circle(coordinates, {
        radius: position.accuracy,
        color: "#5d4b9b",
        fillColor: "#8b73ca",
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(layer);
      L.circleMarker(coordinates, {
        radius: 8,
        color: "#ffffff",
        fillColor: "#5d4b9b",
        fillOpacity: 1,
        weight: 3,
      }).bindPopup("Tu ubicación actual").addTo(layer);
      map.setView(coordinates, 15, { animate: true });
    });
  }, [position]);

  return (
    <div className="leaflet-map-shell">
      <div ref={containerRef} className="leaflet-map" aria-label="Mapa interactivo de OpenStreetMap" />
      {tileError ? <p className="map-tile-error">No se pudo descargar el mapa base. Revisa tu conexión; tu posición sigue disponible.</p> : null}
    </div>
  );
}
