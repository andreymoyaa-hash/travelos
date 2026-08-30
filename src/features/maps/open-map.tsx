"use client";

import type { GoogleMapPoint } from "@/features/maps/google-map";
import type { GeoPosition } from "@/types/travel";

export default function OpenMap({ position, points }: { position?: GeoPosition; points: GoogleMapPoint[] }) {
  const firstPoint = points.find((point) => point.location.latitude !== null && point.location.longitude !== null)?.location;
  const latitude = position?.latitude ?? firstPoint?.latitude ?? 9.93;
  const longitude = position?.longitude ?? firstPoint?.longitude ?? -84.08;
  const delta = 0.035;
  const query = new URLSearchParams({
    bbox: `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });

  return (
    <div className="open-map-shell">
      <iframe
        title="Mapa abierto de OpenStreetMap"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={`https://www.openstreetmap.org/export/embed.html?${query.toString()}`}
      />
      <span className="open-map-attribution">© OpenStreetMap contributors</span>
    </div>
  );
}
