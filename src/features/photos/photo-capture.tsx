"use client";

import Image from "next/image";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, ImagePlus, MapPin, RotateCcw, X } from "lucide-react";

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
  onClose: () => void;
  onSave: (photo: TravelPhoto) => void;
}

export function PhotoCapture({ open, tripId, participant, achievements, days, savedPlaces, position, initialAchievementId, initialDayId, onClose, onSave }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollPositionRef = useRef(0);
  const [preview, setPreview] = useState<string>();
  const [achievementId, setAchievementId] = useState(initialAchievementId ?? "");
  const [dayId, setDayId] = useState(initialDayId ?? "");
  const [activityId, setActivityId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [cameraReady, setCameraReady] = useState(false);
  const activities = useMemo(() => days.find((day) => day.id === dayId)?.activities ?? [], [dayId, days]);

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
    let cancelled = false;
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("La cámara directa no está disponible. Puedes elegir una foto desde el dispositivo.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
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

  const reset = () => {
    setPreview(undefined); setError(undefined); setCameraReady(false);
  };
  const close = () => {
    const previousScrollPosition = scrollPositionRef.current;
    setPreview(undefined); setAchievementId(""); setDayId(""); setActivityId(""); setLocationId(""); setNote(""); setError(undefined); setCameraReady(false); onClose();
    window.requestAnimationFrame(() => window.scrollTo(0, previousScrollPosition));
  };
  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL("image/jpeg", 0.82));
  };
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Selecciona un archivo de imagen válido."); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  };
  const save = () => {
    if (!preview) return;
    onSave({
      id: `photo-${crypto.randomUUID()}`, tripId, dataUrl: preview, createdAt: new Date().toISOString(), participantId: participant.id,
      location: position, achievementId: achievementId || undefined, dayId: dayId || undefined, activityId: activityId || undefined,
      locationId: locationId || undefined, note: note.trim() || undefined,
    });
    close();
  };

  return (
    <div className="modal-backdrop camera-backdrop" role="presentation" onMouseDown={close}>
      <section className={preview ? "camera-modal review" : "camera-modal"} role="dialog" aria-modal="true" aria-labelledby="camera-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><p className="eyebrow">Recuerdo de {participant.name}</p><h2 id="camera-title">{preview ? "Revisar fotografía" : "Tomar foto"}</h2></div><button type="button" className="icon-button" aria-label="Cerrar cámara" onClick={close}><X size={20} /></button></header>
        <div className="camera-review-layout">
          <div className="camera-viewport">
            {preview ? <Image src={preview} alt="Vista previa de la foto" fill sizes="(max-width: 720px) 100vw, 720px" unoptimized /> : <video ref={videoRef} muted playsInline aria-label="Vista de la cámara" onCanPlay={() => setCameraReady(true)} />}
            {error && !cameraReady ? <div className="camera-error"><Camera size={28} /><p>{error}</p></div> : null}
          </div>
          {preview ? <div className="camera-meta review-fields">
            <span><MapPin size={14} /> {position ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : "Sin GPS adjunto"}</span>
            <label>Nota<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="¿Qué quieres recordar?" rows={3} /></label>
            <div className="form-grid"><label>Día<select value={dayId} onChange={(event) => { setDayId(event.target.value); setActivityId(""); }}><option value="">Ninguno</option>{days.map((day) => <option value={day.id} key={day.id}>{day.label}</option>)}</select></label><label>Actividad<select value={activityId} onChange={(event) => setActivityId(event.target.value)} disabled={!dayId}><option value="">Ninguna</option>{activities.map((activity) => <option value={activity.id} key={activity.id}>{activity.title}</option>)}</select></label></div>
            <div className="form-grid"><label>Lugar<select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="">Ninguno</option>{savedPlaces.map((place) => <option value={place.id ?? place.placeId ?? place.name} key={place.id ?? place.placeId ?? place.name}>{place.name}</option>)}</select></label><label>Sello<select value={achievementId} onChange={(event) => setAchievementId(event.target.value)}><option value="">Ninguno</option>{achievements.map((achievement) => <option value={achievement.id} key={achievement.id}>{achievement.icon} {achievement.title}</option>)}</select></label></div>
          </div> : null}
        </div>
        <footer>
          {preview ? <><button type="button" className="secondary-button" onClick={reset}><RotateCcw size={16} /> Volver a tomar</button><button type="button" className="primary-button" onClick={save}><Check size={16} /> Guardar recuerdo</button></> : <><label className="secondary-button file-button"><ImagePlus size={17} /> Elegir foto<input type="file" accept="image/*" capture="environment" onChange={chooseFile} /></label><button type="button" className="primary-button" onClick={capture} disabled={Boolean(error) || !cameraReady}><Camera size={17} /> {cameraReady ? "Capturar" : "Preparando…"}</button></>}
        </footer>
      </section>
    </div>
  );
}
