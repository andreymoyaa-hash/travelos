"use client";

import Image from "next/image";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Clock3, ImagePlus, LocateFixed, MapPin, RotateCcw, X } from "lucide-react";

import type { Achievement, Activity, GeoPosition, Participant, TravelPhoto, TripLocation } from "@/types/travel";

interface PhotoDayOption { id: string; label: string; activities: Activity[] }

interface PhotoCaptureProps {
  open: boolean;
  tripId: string;
  participant: Participant;
  achievements: Achievement[];
  days: PhotoDayOption[];
  savedPlaces: TripLocation[];
  position?: GeoPosition;
  initialAchievementId?: string;
  initialDayId?: string;
  onRequestLocation?: () => Promise<GeoPosition | undefined>;
  onClose: () => void;
  onSave: (photo: TravelPhoto) => void;
}

type GeoAttachStatus = "idle" | "requesting" | "ready" | "unavailable";

const placeKey = (place: TripLocation) => place.id ?? place.placeId ?? place.name;

const distanceInMeters = (position: GeoPosition, place: TripLocation) => {
  if (place.latitude == null || place.longitude == null) return Number.POSITIVE_INFINITY;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(place.latitude - position.latitude);
  const longitudeDelta = toRadians(place.longitude - position.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(position.latitude)) *
      Math.cos(toRadians(place.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const localDateTimeParts = (iso: string, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    localDate: `${value("year")}-${value("month")}-${value("day")}`,
    localTime: `${value("hour")}:${value("minute")}:${value("second")}`,
  };
};

const formatCapturedTime = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));

export function PhotoCapture({
  open,
  tripId,
  participant,
  achievements,
  days,
  savedPlaces,
  position,
  initialAchievementId,
  initialDayId,
  onRequestLocation,
  onClose,
  onSave,
}: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollPositionRef = useRef(0);
  const [preview, setPreview] = useState<string>();
  const [achievementId, setAchievementId] = useState(initialAchievementId ?? "");
  const [dayId, setDayId] = useState(initialDayId ?? "");
  const [activityId, setActivityId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [placeLabel, setPlaceLabel] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedAt, setCapturedAt] = useState<string>();
  const [capturePosition, setCapturePosition] = useState<GeoPosition | undefined>(position);
  const [geoStatus, setGeoStatus] = useState<GeoAttachStatus>(position ? "ready" : "idle");

  const activities = useMemo(() => days.find((day) => day.id === dayId)?.activities ?? [], [dayId, days]);
  const selectedPlace = useMemo(
    () => savedPlaces.find((place) => placeKey(place) === locationId),
    [locationId, savedPlaces],
  );
  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );

  useEffect(() => {
    if (!open) return;
    scrollPositionRef.current = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open || preview) return;
    setCapturePosition(position);
    setGeoStatus(position ? "ready" : "idle");
  }, [open, position, preview]);

  useEffect(() => {
    if (!open || preview) return;
    let cancelled = false;
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("La cámara directa no está disponible. Puedes elegir una foto desde el dispositivo.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setError(undefined);
          setCameraReady(true);
        }
      } catch {
        setError("No se pudo abrir la cámara. Revisa el permiso o elige una foto del dispositivo.");
      }
    };
    void startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open, preview]);

  if (!open) return null;

  const linkNearestSavedPlace = (nextPosition: GeoPosition) => {
    if (locationId) return;
    const nearest = savedPlaces
      .map((place) => ({ place, distance: distanceInMeters(nextPosition, place) }))
      .sort((left, right) => left.distance - right.distance)[0];
    if (!nearest || nearest.distance > 1500) return;
    setLocationId(placeKey(nearest.place));
    setPlaceLabel((current) => current || nearest.place.name);
  };

  const attachLiveLocation = async () => {
    if (!onRequestLocation) {
      setGeoStatus(capturePosition ? "ready" : "unavailable");
      return capturePosition;
    }
    setGeoStatus("requesting");
    const nextPosition = await onRequestLocation();
    if (!nextPosition) {
      setGeoStatus(capturePosition ? "ready" : "unavailable");
      return capturePosition;
    }
    setCapturePosition(nextPosition);
    setGeoStatus("ready");
    linkNearestSavedPlace(nextPosition);
    return nextPosition;
  };

  const preparePreviewMetadata = () => {
    setCapturedAt(new Date().toISOString());
    if (capturePosition) {
      setGeoStatus("ready");
      linkNearestSavedPlace(capturePosition);
    } else {
      void attachLiveLocation();
    }
  };

  const reset = () => {
    setPreview(undefined);
    setCapturedAt(undefined);
    setCapturePosition(position);
    setGeoStatus(position ? "ready" : "idle");
    setError(undefined);
    setCameraReady(false);
  };

  const close = () => {
    const previousScrollPosition = scrollPositionRef.current;
    setPreview(undefined);
    setAchievementId("");
    setDayId("");
    setActivityId("");
    setLocationId("");
    setPlaceLabel("");
    setNote("");
    setCapturedAt(undefined);
    setCapturePosition(undefined);
    setGeoStatus("idle");
    setError(undefined);
    setCameraReady(false);
    onClose();
    window.requestAnimationFrame(() => window.scrollTo(0, previousScrollPosition));
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL("image/jpeg", 0.82));
    preparePreviewMetadata();
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen válido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
      preparePreviewMetadata();
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!preview) return;
    const finalCapturedAt = capturedAt ?? new Date().toISOString();
    const fallbackPosition =
      !capturePosition && selectedPlace?.latitude != null && selectedPlace.longitude != null
        ? {
            latitude: selectedPlace.latitude,
            longitude: selectedPlace.longitude,
            accuracy: 0,
            timestamp: Date.parse(finalCapturedAt),
          }
        : undefined;
    const finalPosition = capturePosition ?? fallbackPosition;
    const geolocationSource: TravelPhoto["geolocationSource"] = capturePosition
      ? "live"
      : fallbackPosition
        ? "manual"
        : "none";
    const { localDate, localTime } = localDateTimeParts(finalCapturedAt, browserTimeZone);
    const finalPlaceLabel = placeLabel.trim() || selectedPlace?.name || undefined;

    onSave({
      id: `photo-${crypto.randomUUID()}`,
      tripId,
      dataUrl: preview,
      createdAt: finalCapturedAt,
      capturedAt: finalCapturedAt,
      timezone: browserTimeZone,
      localDate,
      localTime,
      participantId: participant.id,
      location: finalPosition,
      geolocationSource,
      placeLabel: finalPlaceLabel,
      achievementId: achievementId || undefined,
      dayId: dayId || undefined,
      activityId: activityId || undefined,
      locationId: locationId || undefined,
      note: note.trim() || undefined,
    });
    close();
  };

  const gpsText =
    geoStatus === "requesting"
      ? "Buscando ubicación…"
      : capturePosition
        ? `${capturePosition.latitude.toFixed(5)}, ${capturePosition.longitude.toFixed(5)} · ±${Math.round(capturePosition.accuracy)} m`
        : selectedPlace?.latitude != null && selectedPlace.longitude != null
          ? "Ubicación vinculada manualmente al lugar"
          : "Sin ubicación adjunta";

  return (
    <div className="modal-backdrop camera-backdrop" role="presentation" onMouseDown={close}>
      <section
        className={preview ? "camera-modal review" : "camera-modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="eyebrow">Recuerdo de {participant.name}</p>
            <h2 id="camera-title">{preview ? "Revisar fotografía" : "Tomar foto"}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar cámara" onClick={close}>
            <X size={20} />
          </button>
        </header>

        <div className="camera-review-layout">
          <div className="camera-viewport">
            {preview ? (
              <Image
                src={preview}
                alt="Vista previa de la foto"
                fill
                sizes="(max-width: 720px) 100vw, 720px"
                unoptimized
              />
            ) : (
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label="Vista de la cámara"
                onCanPlay={() => setCameraReady(true)}
              />
            )}
            {error && !cameraReady ? (
              <div className="camera-error">
                <Camera size={28} />
                <p>{error}</p>
              </div>
            ) : null}
          </div>

          {preview ? (
            <div className="camera-meta review-fields">
              <div className={`camera-memory-status ${capturePosition ? "is-ready" : ""}`}>
                <span>
                  <LocateFixed size={15} />
                  <strong>{capturePosition ? "GPS adjunto" : "Ubicación del recuerdo"}</strong>
                  <small>{gpsText}</small>
                </span>
                <button
                  type="button"
                  className="quiet-button camera-location-button"
                  disabled={geoStatus === "requesting"}
                  onClick={() => void attachLiveLocation()}
                >
                  <MapPin size={14} />
                  {geoStatus === "requesting" ? "Buscando…" : capturePosition ? "Actualizar GPS" : "Adjuntar GPS"}
                </button>
              </div>

              {capturedAt ? (
                <div className="camera-captured-time">
                  <Clock3 size={14} />
                  <span>
                    <strong>Capturada</strong>
                    <small>{formatCapturedTime(capturedAt, browserTimeZone)} · {browserTimeZone}</small>
                  </span>
                </div>
              ) : null}

              <label>
                Lugar del recuerdo
                <input
                  value={placeLabel}
                  onChange={(event) => setPlaceLabel(event.target.value)}
                  placeholder="Ej. Arashiyama, Kyoto"
                />
              </label>

              <label>
                Nota
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="¿Qué quieres recordar?"
                  rows={3}
                />
              </label>

              <div className="form-grid">
                <label>
                  Día
                  <select
                    value={dayId}
                    onChange={(event) => {
                      setDayId(event.target.value);
                      setActivityId("");
                    }}
                  >
                    <option value="">Ninguno</option>
                    {days.map((day) => (
                      <option value={day.id} key={day.id}>{day.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Actividad
                  <select
                    value={activityId}
                    onChange={(event) => setActivityId(event.target.value)}
                    disabled={!dayId}
                  >
                    <option value="">Ninguna</option>
                    {activities.map((activity) => (
                      <option value={activity.id} key={activity.id}>{activity.title}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Lugar guardado
                  <select
                    value={locationId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setLocationId(nextId);
                      const nextPlace = savedPlaces.find((place) => placeKey(place) === nextId);
                      if (nextPlace) setPlaceLabel(nextPlace.name);
                    }}
                  >
                    <option value="">Ninguno</option>
                    {savedPlaces.map((place) => (
                      <option value={placeKey(place)} key={placeKey(place)}>{place.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Sello
                  <select value={achievementId} onChange={(event) => setAchievementId(event.target.value)}>
                    <option value="">Ninguno</option>
                    {achievements.map((achievement) => (
                      <option value={achievement.id} key={achievement.id}>
                        {achievement.icon} {achievement.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}
        </div>

        <footer>
          {preview ? (
            <>
              <button type="button" className="secondary-button" onClick={reset}>
                <RotateCcw size={16} /> Volver a tomar
              </button>
              <button type="button" className="primary-button" onClick={save}>
                <Check size={16} /> Guardar recuerdo
              </button>
            </>
          ) : (
            <>
              <label className="secondary-button file-button">
                <ImagePlus size={17} /> Elegir foto
                <input type="file" accept="image/*" capture="environment" onChange={chooseFile} />
              </label>
              <button
                type="button"
                className="primary-button"
                onClick={capture}
                disabled={Boolean(error) || !cameraReady}
              >
                <Camera size={17} /> {cameraReady ? "Capturar" : "Preparando…"}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}
