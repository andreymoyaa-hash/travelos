"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, MapPin, RotateCcw, X } from "lucide-react";

import type { Achievement, GeoPosition, Participant, TravelPhoto } from "@/types/travel";

interface PhotoCaptureProps {
  open: boolean;
  participant: Participant;
  achievements: Achievement[];
  position?: GeoPosition;
  onClose: () => void;
  onSave: (photo: TravelPhoto) => void;
}

export function PhotoCapture({ open, participant, achievements, position, onClose, onSave }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string>();
  const [achievementId, setAchievementId] = useState("");
  const [error, setError] = useState<string>();
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("La cámara no está disponible en este navegador.");
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
        }
      } catch {
        setError("No se pudo abrir la cámara. Revisa el permiso del navegador e inténtalo de nuevo.");
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (preview || !streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play();
  }, [preview]);

  if (!open) return null;

  const close = () => {
    setPreview(undefined);
    setAchievementId("");
    setError(undefined);
    setCameraReady(false);
    onClose();
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.86));
  };

  const save = () => {
    if (!preview) return;
    onSave({
      id: `photo-${crypto.randomUUID()}`,
      dataUrl: preview,
      createdAt: new Date().toISOString(),
      participantId: participant.id,
      location: position,
      achievementId: achievementId || undefined,
    });
    close();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <section className="camera-modal" role="dialog" aria-modal="true" aria-labelledby="camera-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><p className="eyebrow">Recuerdo de {participant.name}</p><h2 id="camera-title">Tomar foto</h2></div>
          <button type="button" className="icon-button" aria-label="Cerrar cámara" onClick={close}><X size={20} /></button>
        </header>

        <div className="camera-viewport">
          {preview ? <Image src={preview} alt="Vista previa de la foto" fill sizes="(max-width: 720px) 90vw, 620px" unoptimized /> : <video ref={videoRef} muted playsInline aria-label="Vista de la cámara" onCanPlay={() => setCameraReady(true)} />}
          {error ? <div className="camera-error"><Camera size={28} /><p>{error}</p></div> : null}
        </div>

        <div className="camera-meta">
          <span><MapPin size={14} /> {position ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : "Sin ubicación adjunta"}</span>
          <label>
            Relacionar con un logro
            <select value={achievementId} onChange={(event) => setAchievementId(event.target.value)}>
              <option value="">Ninguno</option>
              {achievements.map((achievement) => <option value={achievement.id} key={achievement.id}>{achievement.icon} {achievement.title}</option>)}
            </select>
          </label>
        </div>

        <footer>
          {preview ? (
            <>
              <button type="button" className="secondary-button" onClick={() => setPreview(undefined)}><RotateCcw size={16} /> Repetir</button>
              <button type="button" className="primary-button" onClick={save}><Check size={16} /> Guardar foto</button>
            </>
          ) : (
            <button type="button" className="primary-button full-width" onClick={capture} disabled={Boolean(error) || !cameraReady}><Camera size={17} /> {cameraReady ? "Capturar" : "Preparando cámara…"}</button>
          )}
        </footer>
      </section>
    </div>
  );
}
