"use client";

import { useCallback, useState } from "react";

import type { GeoPosition, LocationStatus } from "@/types/travel";

const messageByCode: Record<number, string> = {
  1: "El permiso de ubicación fue rechazado. Puedes habilitarlo desde la configuración del navegador.",
  2: "No fue posible determinar tu ubicación actual.",
  3: "La solicitud de ubicación tardó demasiado. Inténtalo nuevamente.",
};

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition>();
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string>();

  const requestLocation = useCallback(async (): Promise<GeoPosition | undefined> => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setError("Este navegador no ofrece acceso a la ubicación.");
      return undefined;
    }

    setStatus("requesting");
    setError(undefined);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords, timestamp }) => {
          const nextPosition = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            timestamp,
          };
          setPosition(nextPosition);
          setStatus("granted");
          resolve(nextPosition);
        },
        (locationError) => {
          setStatus(locationError.code === 1 ? "denied" : "unavailable");
          setError(messageByCode[locationError.code] ?? "No se pudo obtener tu ubicación.");
          resolve(undefined);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      );
    });
  }, []);

  return { position, status, error, requestLocation };
}
