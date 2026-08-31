"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Camera,
  Clock3,
  Download,
  Gift,
  Hand,
  LocateFixed,
  MapPin,
  Plus,
  Share2,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { RouteMemoryTicket } from "@/components/cards/route-memory-ticket";
import { SectionHeading } from "@/components/ui/section-heading";
import { PassportStampMark } from "@/features/achievements/passport-stamp-mark";
import { getCountryExperience } from "@/lib/nioli/country-experience";
import { officialBradyAsset, hasOfficialCountryAssets } from "@/lib/nioli/official-assets";
import type {
  Achievement,
  CompanionProfile,
  CompanionProgress,
  CountryTheme,
  GeoPosition,
  LocationStatus,
  Participant,
  TravelPhoto,
  Trip,
} from "@/types/travel";

interface AdventureViewProps {
  trip: Trip;
  theme: CountryTheme;
  achievements: Achievement[];
  participant: Participant;
  photos: TravelPhoto[];
  position?: GeoPosition;
  locationStatus: LocationStatus;
  locationError?: string;
  companionProfile: CompanionProfile;
  companionProgress: CompanionProgress;
  onRequestLocation: () => Promise<GeoPosition | undefined>;
  onSavePhoto: (photo: TravelPhoto) => void;
  onToggleAchievement: (id: string) => void;
  onAddAchievement: (achievement: Achievement) => void;
  onCompanionAction: (action: "snack" | "hello" | "memory" | "explore") => void;
  onOpenCamera: (achievementId?: string) => void;
}

function getPhotoPlace(photo: TravelPhoto) {
  return photo.placeLabel?.trim() || photo.note?.trim() || "Recuerdo de viaje";
}

function getPhotoDateIso(photo: TravelPhoto) {
  return photo.capturedAt ?? photo.createdAt;
}

function formatPhotoDate(photo: TravelPhoto) {
  const iso = getPhotoDateIso(photo);
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: photo.timezone || undefined,
  }).format(new Date(iso));
}

function formatPhotoTime(photo: TravelPhoto) {
  if (photo.localTime) {
    return photo.timezone ? `${photo.localTime} · ${photo.timezone}` : photo.localTime;
  }
  const iso = getPhotoDateIso(photo);
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: photo.timezone || undefined,
  }).format(new Date(iso));
}

function formatPhotoGps(photo: TravelPhoto) {
  if (!photo.location) return "Sin geolocalización";
  const lat = photo.location.latitude.toFixed(5);
  const lng = photo.location.longitude.toFixed(5);
  const accuracy = Number.isFinite(photo.location.accuracy) ? ` ±${Math.round(photo.location.accuracy)} m` : "";
  return `${lat}, ${lng}${accuracy}`;
}

function buildMapsUrl(photo: TravelPhoto) {
  if (!photo.location) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${photo.location.latitude},${photo.location.longitude}`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let cursorY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }

  if (line) ctx.fillText(line, x, cursorY);
  return cursorY;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

async function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    if (!src.startsWith("data:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    image.src = src;
  });
}

async function loadPostcardCanvasImage(src: string) {
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error("No se pudo descargar la imagen.");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
        image.src = objectUrl;
      });
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    }
  } catch {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
      image.src = src;
    });
  }
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const frameRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let drawX = x;
  let drawY = y;

  if (imageRatio > frameRatio) {
    drawWidth = height * imageRatio;
    drawX = x - (drawWidth - width) / 2;
  } else {
    drawHeight = width / imageRatio;
    drawY = y - (drawHeight - height) / 2;
  }

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.clip();
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

function drawFittedCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight = 800,
) {
  let fontSize = startSize;
  while (fontSize > minSize) {
    ctx.font = `${weight} ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 2;
  }
  ctx.fillText(text, x, y);
}

async function buildPostcardBlob(photo: TravelPhoto, trip: Trip, participant: Participant) {
  try {
    const [photoImage, postmarkImage] = await Promise.all([
      loadPostcardCanvasImage(photo.dataUrl),
      loadPostcardCanvasImage("/nioli/themes/japan/postcards/jp_nioli_postmark_red.png").catch(() => undefined),
    ]);

    // 4:5 social format. The exported image is intentionally FRONT-ONLY.
    const canvas = document.createElement("canvas");
    canvas.width = 1440;
    canvas.height = 1800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const paper = "#FCFAF2";
    const ink = "#0B1013";
    const kon = "#0F2540";
    const red = "#AB3B3A";
    const muted = "#746D64";
    const border = "#DCCFBB";

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Very subtle paper depth.
    const wash = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    wash.addColorStop(0, "rgba(255,255,255,.42)");
    wash.addColorStop(.55, "rgba(252,250,242,0)");
    wash.addColorStop(1, "rgba(180,150,115,.045)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer postcard frame.
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(48, 48, canvas.width - 96, canvas.height - 96, 34);
    ctx.stroke();

    // Small brand line. Not a large logo.
    ctx.fillStyle = red;
    ctx.font = '900 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.letterSpacing = "2px";
    ctx.fillText("NIOLI", 92, 118);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = muted;
    ctx.font = '700 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(trip.name, 196, 118);

    // Main photograph.
    const photoX = 92;
    const photoY = 158;
    const photoWidth = 1256;
    const photoHeight = 1320;

    ctx.fillStyle = "#E7E0D5";
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 18);
    ctx.fill();
    drawCoverImage(ctx, photoImage, photoX, photoY, photoWidth, photoHeight);

    // Hairline around image.
    ctx.strokeStyle = "rgba(15,37,64,.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 18);
    ctx.stroke();

    // Caption zone: no dark overlay.
    const place = getPhotoPlace(photo);
    const date = formatPhotoDate(photo);

    ctx.fillStyle = kon;
    drawFittedCanvasText(ctx, place, 96, 1566, 920, 58, 38, 850);

    ctx.fillStyle = muted;
    ctx.font = '700 25px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(date, 98, 1614);

    ctx.fillStyle = red;
    ctx.font = '900 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText("POSTCARD MEMORY", 98, 1680);

    ctx.fillStyle = ink;
    ctx.font = '650 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`Recuerdo de ${participant.name}`, 98, 1714);

    // Approved postmark, decorative only and deliberately faint.
    if (postmarkImage) {
      ctx.save();
      ctx.globalAlpha = .16;
      ctx.translate(1228, 1620);
      ctx.rotate(-8 * Math.PI / 180);
      const markSize = 210;
      ctx.drawImage(postmarkImage, -markSize / 2, -markSize / 2, markSize, markSize);
      ctx.restore();
    }

    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.96));
  } catch {
    return null;
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeFileName(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "postal-nioli";
}

export function AdventureView({
  trip,
  theme,
  achievements,
  participant,
  photos,
  position,
  locationStatus,
  locationError,
  companionProfile,
  companionProgress,
  onRequestLocation,
  onToggleAchievement,
  onAddAchievement,
  onCompanionAction,
  onOpenCamera,
}: AdventureViewProps) {
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>();
  const [customOpen, setCustomOpen] = useState(false);
  const [recentlyUnlockedId, setRecentlyUnlockedId] = useState<string>();
  const unlocked = achievements.filter((achievement) => achievement.unlockedBy.includes(participant.id)).length;
  const progress = achievements.length ? (unlocked / achievements.length) * 100 : 0;
  const selected = achievements.find((achievement) => achievement.id === selectedId);
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);
  const experience = getCountryExperience(trip.countryId);
  const passportCover = experience.assets.passport.cover;
  const bradyAsset = officialBradyAsset(trip.countryId);
  const officialCollection = hasOfficialCountryAssets(trip.countryId);
  const groups = useMemo(() => {
    const official = achievements.filter((achievement) => Boolean(achievement.stamp?.assetPath));
    const personal = achievements.filter((achievement) => achievement.custom);
    if (officialCollection && official.length) {
      return [
        { location: theme.name, achievements: official, official: true },
        ...(personal.length ? [{ location: "Sellos personales", achievements: personal, official: false }] : []),
      ];
    }
    return Array.from(new Set(achievements.map((achievement) => achievement.city ?? achievement.location ?? "General"))).map((location) => ({
      location,
      achievements: achievements.filter((achievement) => (achievement.city ?? achievement.location ?? "General") === location),
      official: false,
    }));
  }, [achievements, officialCollection, theme.name]);

  useEffect(() => {
    if (!recentlyUnlockedId) return;
    const timeout = window.setTimeout(() => setRecentlyUnlockedId(undefined), 1250);
    return () => window.clearTimeout(timeout);
  }, [recentlyUnlockedId]);

  const addCustomStamp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onAddAchievement({
      id: `stamp-${crypto.randomUUID()}`,
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim(),
      icon: String(form.get("icon") || "✦").trim() || "✦",
      color: theme.colors.accent,
      category: "travel",
      unlockMethods: ["photo", "manual"],
      unlockedBy: [],
      location: String(form.get("location") || "Destino").trim(),
      city: String(form.get("location") || "Destino").trim(),
      custom: true,
      rarity: form.get("rarity") as Achievement["rarity"],
    });
    setCustomOpen(false);
  };

  return (
    <div className="view-stack passport-view">
      <SectionHeading
        eyebrow={`Nioli Passport · ${participant.name}`}
        title="Colecciona recuerdos, no tareas"
        description="Cada sello pertenece a este viaje y se valida de forma manual, con GPS real o mediante una fotografía asociada. Tus recuerdos viven aparte como postales compartibles."
        action={
          <div className="heading-actions">
            <button type="button" className="secondary-button" onClick={() => setCustomOpen(true)}><Plus size={17} /> Sello personalizado</button>
            <button type="button" className="primary-button" onClick={() => onOpenCamera()}><Camera size={17} /> Tomar foto</button>
          </div>
        }
      />

      <section className={`passport-cover ${theme.decorativeStyle}`}>
        <div className={passportCover ? "passport-cover-mark has-asset" : "passport-cover-mark"}>{passportCover ? <Image src={passportCover} alt={`Portada visual de ${theme.name}`} width={100} height={138} /> : theme.landmark}</div>
        <div><span className="adventure-label"><Sparkles size={14} /> {theme.labels.passport}</span><h2>{trip.name}</h2><p>{theme.description}</p><div className="collection-progress"><span><strong>{unlocked}</strong> de {achievements.length} sellos</span><ProgressBar value={progress} color={theme.colors.highlight} label="Sellos desbloqueados" /></div></div>
        <div className="passport-owner"><small>Viajero</small><strong>{participant.name}</strong><span>{Math.round(progress)}% completo</span></div>
      </section>

      {officialCollection ? <section className="passport-route-memory"><div className="subsection-heading"><div><p className="eyebrow">Recuerdo de ruta</p><h2>La primera huella del viaje</h2></div></div><RouteMemoryTicket trip={trip} className="passport-route-ticket" /></section> : null}

      <div className="adventure-tools"><div><LocateFixed size={19} /><span><strong>{position ? "Ubicación disponible" : "Ubicación pendiente"}</strong><small>{position ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : locationError ?? "El GPS sólo se solicita al pulsar el botón."}</small></span></div><button type="button" className="secondary-button" disabled={locationStatus === "requesting"} onClick={() => void onRequestLocation()}>{locationStatus === "requesting" ? "Buscando…" : "Usar mi ubicación"}</button></div>

      <div className="passport-layout">
        <section className="passport-pages">
          <div className="subsection-heading"><div><p className="eyebrow">Páginas del pasaporte</p><h2>{officialCollection ? "Tu colección oficial del viaje" : "Sellos por ciudad o región"}</h2></div><span className="collection-count"><Trophy size={16} /> {unlocked}/{achievements.length}</span></div>
          {groups.length ? groups.map((group) => {
            const groupUnlocked = group.achievements.filter((achievement) => achievement.unlockedBy.includes(participant.id)).length;
            return <section className={group.official ? "passport-city-page official-collection-page" : "passport-city-page"} key={group.location}><header><div><p className="eyebrow">Destino</p><h3>{group.location}</h3></div><span>{groupUnlocked} / {group.achievements.length} sellos</span></header><ProgressBar value={group.achievements.length ? (groupUnlocked / group.achievements.length) * 100 : 0} color={theme.colors.accent} label={`Progreso de ${group.location}`} /><div className={group.official ? "stamp-grid official-stamp-grid" : "stamp-grid"}>{group.achievements.map((achievement) => {
              const isUnlocked = achievement.unlockedBy.includes(participant.id);
              const linkedPhoto = photos.find((photo) => photo.achievementId === achievement.id);
              const lockedLabel = achievement.discovery === "secret" ? "Sello por descubrir" : achievement.hint ?? achievement.title;
              const statusLabel = isUnlocked
                ? achievement.unlockedAt?.[participant.id]
                  ? new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(new Date(achievement.unlockedAt[participant.id]))
                  : `En el pasaporte de ${participant.name}`
                : achievement.discovery === "secret" ? "Explora para revelar la pista" : "Aún no estampado";
              return <button type="button" key={achievement.id} className={isUnlocked ? "passport-stamp-entry unlocked" : "passport-stamp-entry locked"} onClick={() => setSelectedId(achievement.id)}><PassportStampMark achievement={achievement} unlocked={isUnlocked} recentlyUnlocked={recentlyUnlockedId === achievement.id} /><span className="passport-stamp-caption"><strong>{isUnlocked ? achievement.title : lockedLabel}</strong><small>{statusLabel}</small></span>{linkedPhoto ? <span className="stamp-memory-badge"><Camera size={12} /> Recuerdo</span> : null}</button>;
            })}</div></section>;
          }) : <div className="empty-state"><span>✦</span><h2>Tu pasaporte está listo</h2><p>Crea el primer sello personalizado para este viaje.</p><button type="button" className="primary-button" onClick={() => setCustomOpen(true)}>Crear sello</button></div>}
        </section>

        <aside className="companion-card companion-v2">
          <div className="companion-portrait" aria-hidden="true">{bradyAsset ? <Image className="companion-brady" src={bradyAsset} alt="" fill sizes="150px" /> : <span className="companion-face">{companionProfile.icon}</span>}</div>
          <p className="eyebrow">Companion · nivel {companionProgress.level}</p><h2>{companionProfile.name}</h2><p>{companionProgress.lastMessage ?? "¿Qué exploramos primero?"}</p>
          <div className="companion-mood"><span>Estado</span><strong>{companionProgress.mood === "excited" ? "Emocionado" : companionProgress.mood === "happy" ? "Feliz" : companionProgress.mood === "resting" ? "Descansando" : "Curioso"}</strong></div>
          <div className="companion-xp"><span><small>XP</small><strong>{companionProgress.xp}</strong></span><ProgressBar value={companionProgress.xp % 100} color={theme.colors.highlight} label="Progreso del companion" /></div>
          <div className="companion-actions"><button type="button" onClick={() => onCompanionAction("snack")}><Gift size={15} /> Dar snack</button><button type="button" onClick={() => onCompanionAction("hello")}><Hand size={15} /> Saludar</button><button type="button" onClick={() => onCompanionAction("memory")}><Camera size={15} /> Ver recuerdo</button><button type="button" onClick={() => onCompanionAction("explore")}><MapPin size={15} /> Explorar</button></div>
        </aside>
      </div>

      <section className="memory-postcards" aria-labelledby="memory-postcards-title">
        <div className="subsection-heading">
          <div>
            <p className="eyebrow">Recuerdos compartibles</p>
            <h2 id="memory-postcards-title">Postales de {participant.name}</h2>
          </div>
          <span className="collection-count"><Camera size={16} /> {photos.length}</span>
        </div>

        {photos.length ? (
          <div className="memory-postcards-grid">
            {photos.map((photo) => (
              <button type="button" key={photo.id} className="memory-postcard-card" onClick={() => setSelectedPhotoId(photo.id)}>
                <div className="memory-postcard-thumb">
                  <Image src={photo.dataUrl} alt={photo.note || `Recuerdo de ${participant.name}`} fill sizes="(max-width: 720px) 90vw, (max-width: 1200px) 42vw, 360px" unoptimized />
                  <span className="memory-postcard-pill">{getPhotoPlace(photo)}</span>
                </div>
                <div className="memory-postcard-copy">
                  <strong>{getPhotoPlace(photo)}</strong>
                  <span><Clock3 size={13} /> {formatPhotoDate(photo)}</span>
                  <small>{formatPhotoTime(photo)}</small>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            <Camera size={28} />
            <h2>Todavía no hay postales</h2>
            <p>Toma la primera foto y se convertirá en un recuerdo compartible con fecha, hora y ubicación.</p>
          </div>
        )}
      </section>

      {selected ? <StampDetail achievement={selected} participant={participant} photos={photos} position={position} recentlyUnlocked={recentlyUnlockedId === selected.id} onClose={() => setSelectedId(undefined)} onToggle={() => { const wasUnlocked = selected.unlockedBy.includes(participant.id); if (!wasUnlocked) setRecentlyUnlockedId(selected.id); onToggleAchievement(selected.id); }} onCamera={() => onOpenCamera(selected.id)} onGps={onRequestLocation} /> : null}
      {selectedPhoto ? <MemoryPostcardDetail photo={selectedPhoto} trip={trip} participant={participant} onClose={() => setSelectedPhotoId(undefined)} /> : null}
      {customOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setCustomOpen(false)}><section className="expense-modal" role="dialog" aria-modal="true" aria-labelledby="custom-stamp-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Pasaporte editable</p><h2 id="custom-stamp-title">Nuevo sello</h2></div><button type="button" className="icon-button" onClick={() => setCustomOpen(false)} aria-label="Cerrar"><X size={20} /></button></header><form onSubmit={addCustomStamp}><div className="form-grid"><label>Icono<input name="icon" defaultValue="✦" maxLength={4} /></label><label>Rareza<select name="rarity" defaultValue="common"><option value="common">Común</option><option value="special">Especial</option><option value="rare">Raro</option></select></label></div><label>Nombre<input name="title" required autoFocus /></label><label>Ciudad o región<input name="location" required /></label><label>Descripción<textarea name="description" rows={3} required /></label><button type="submit" className="primary-button full-width">Crear sello bloqueado</button></form></section></div> : null}
    </div>
  );
}

function MemoryPostcardDetail({ photo, trip, participant, onClose }: { photo: TravelPhoto; trip: Trip; participant: Participant; onClose: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "sharing" | "downloading" | "done" | "error">("idle");
  const place = getPhotoPlace(photo);
  const dateLabel = formatPhotoDate(photo);
  const timeLabel = photo.localTime
    ? photo.localTime.slice(0, 5)
    : new Intl.DateTimeFormat("es", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: photo.timezone || undefined,
      }).format(new Date(getPhotoDateIso(photo)));
  const hasLocation = Boolean(photo.location);
  const note = photo.note?.trim() || `Un recuerdo de ${place} durante ${trip.name}.`;

  useEffect(() => {
    setFlipped(false);
    setShareState("idle");
  }, [photo.id]);

  const downloadShareImage = async () => {
    setShareState("downloading");
    const blob = await buildPostcardBlob(photo, trip, participant);
    if (!blob) {
      setShareState("error");
      return;
    }
    downloadBlob(blob, `${sanitizeFileName(place)}-nioli-postal.png`);
    setShareState("done");
  };

  const shareFront = async () => {
    setShareState("sharing");
    const blob = await buildPostcardBlob(photo, trip, participant);
    if (!blob) {
      setShareState("error");
      return;
    }

    const fileName = `${sanitizeFileName(place)}-nioli-postal.png`;
    const file = new File([blob], fileName, { type: "image/png" });
    const shareText = `${place} · ${trip.name} · ${dateLabel}`;

    try {
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${place} · ${trip.name}`,
          text: shareText,
          files: [file],
        });
        setShareState("done");
        return;
      }

      // Desktop fallback: give the user the finished image immediately.
      downloadBlob(blob, fileName);
      setShareState("done");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareState("idle");
        return;
      }
      setShareState("error");
    }
  };

  const statusText =
    shareState === "sharing"
      ? "Preparando imagen para compartir…"
      : shareState === "downloading"
        ? "Generando postal PNG…"
        : shareState === "done"
          ? "Postal lista."
          : shareState === "error"
            ? "No pude generar la imagen. Intenta de nuevo."
            : flipped
              ? "Reverso · detalles del recuerdo"
              : "Frente · fotografía del recuerdo";

  return (
    <div className="modal-backdrop postcard-flip-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="postcard-flip-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="postcard-flip-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="postcard-flip-toolbar">
          <div>
            <p className="eyebrow">Recuerdo de {participant.name}</p>
            <h2 id="postcard-flip-title">{place}</h2>
          </div>
          <div className="postcard-flip-toolbar-actions">
            <button
              type="button"
              className="postcard-turn-button"
              onClick={() => setFlipped((current) => !current)}
              aria-pressed={flipped}
            >
              {flipped ? "Ver frente" : "Dar vuelta"}
            </button>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar postal">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="postcard-flip-scene">
          <div className={flipped ? "postcard-flip-card is-flipped" : "postcard-flip-card"}>
            <article className="postcard-flip-face postcard-flip-front" aria-hidden={flipped}>
              <div className="postcard-front-sheet">
                <div className="postcard-front-photo">
                  <Image
                    src={photo.dataUrl}
                    alt={photo.note || `Recuerdo de ${place}`}
                    fill
                    sizes="(max-width: 760px) 92vw, 900px"
                    unoptimized
                  />
                </div>

                <div className="postcard-front-caption">
                  <div>
                    <span>NIOLI · {trip.name}</span>
                    <strong>{place}</strong>
                  </div>
                  <small>{dateLabel}</small>
                </div>

                <span className="postcard-approved-postmark" aria-hidden="true" />
              </div>
            </article>

            <article className="postcard-flip-face postcard-flip-back" aria-hidden={!flipped}>
              <div className="postcard-back-sheet">
                <section className="postcard-back-message">
                  <p className="postcard-back-kicker">Postal de {participant.name}</p>
                  <h3>{place}</h3>
                  <p className="postcard-handwritten-note">{note}</p>

                  <div className="postcard-back-signature">
                    <span>Desde</span>
                    <strong>{trip.name}</strong>
                  </div>
                </section>

                <div className="postcard-back-divider" aria-hidden="true" />

                <section className="postcard-back-details">
                  <span className="postcard-approved-postmark back" aria-hidden="true" />

                  <div className="postcard-address-lines" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>

                  <dl>
                    <div>
                      <dt>Lugar</dt>
                      <dd>{place}</dd>
                    </div>
                    <div>
                      <dt>Fecha</dt>
                      <dd>{dateLabel}</dd>
                    </div>
                    <div>
                      <dt>Hora</dt>
                      <dd>{timeLabel}</dd>
                    </div>
                    <div>
                      <dt>Viajero</dt>
                      <dd>{participant.name}</dd>
                    </div>
                  </dl>

                  <div className={hasLocation ? "postcard-location-status ready" : "postcard-location-status"}>
                    <MapPin size={14} />
                    <span>{hasLocation ? "Ubicación guardada con el recuerdo" : "Ubicación no disponible"}</span>
                  </div>
                </section>
              </div>
            </article>
          </div>
        </div>

        <footer className="postcard-flip-footer postcard-share-footer">
          <span className={shareState === "error" ? "postcard-share-status error" : "postcard-share-status"}>
            {statusText}
          </span>

          <div className="postcard-share-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setFlipped((current) => !current)}
              disabled={shareState === "sharing" || shareState === "downloading"}
            >
              {flipped ? "Volver a la foto" : "Ver reverso"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => void downloadShareImage()}
              disabled={shareState === "sharing" || shareState === "downloading"}
            >
              <Download size={16} />
              {shareState === "downloading" ? "Generando…" : "Descargar PNG"}
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => void shareFront()}
              disabled={shareState === "sharing" || shareState === "downloading"}
            >
              <Share2 size={16} />
              {shareState === "sharing" ? "Preparando…" : "Compartir postal"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
function StampDetail({ achievement, participant, photos, position, recentlyUnlocked, onClose, onToggle, onCamera, onGps }: { achievement: Achievement; participant: Participant; photos: TravelPhoto[]; position?: GeoPosition; recentlyUnlocked?: boolean; onClose: () => void; onToggle: () => void; onCamera: () => void; onGps: () => Promise<GeoPosition | undefined> }) {
  const unlocked = achievement.unlockedBy.includes(participant.id);
  const photo = photos.find((item) => item.achievementId === achievement.id);
  const condition = achievement.unlockMethods.map((method) => method === "photo" ? "Foto" : method === "gps" ? "GPS" : "Manual").join(" · ");
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="expense-modal stamp-detail-modal" role="dialog" aria-modal="true" aria-labelledby="stamp-detail-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">{achievement.custom ? "Sello personalizado" : unlocked ? "Estampa obtenida" : "Sello por descubrir"}</p><h2 id="stamp-detail-title">{achievement.discovery === "secret" && !unlocked ? "Una experiencia te espera" : achievement.title}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header><div className="stamp-detail-stage"><PassportStampMark achievement={achievement} unlocked={unlocked} large recentlyUnlocked={recentlyUnlocked} />{unlocked ? <span className="stamp-detail-chak" aria-hidden="true">CHAK!</span> : null}</div><p className="stamp-detail-description">{unlocked ? achievement.description : achievement.hint ?? achievement.description}</p><dl><div><dt>Ciudad / región</dt><dd>{achievement.city ?? achievement.location}</dd></div><div><dt>Cómo se obtiene</dt><dd>{condition}</dd></div><div><dt>Estado</dt><dd>{unlocked ? `En el pasaporte de ${participant.name}` : "Aún no estampado"}</dd></div><div><dt>Ubicación</dt><dd>{position ? "GPS disponible" : "No solicitada"}</dd></div></dl>{photo ? <figure className="stamp-detail-photo"><Image src={photo.dataUrl} alt="Foto asociada al sello" fill sizes="500px" unoptimized /></figure> : null}{achievement.source ? <a className="stamp-source-link" href={achievement.source.url} target="_blank" rel="noreferrer">Referencia del destino · {achievement.source.label}</a> : null}<div className="stamp-detail-actions"><button type="button" className="secondary-button" onClick={() => void onGps()} disabled={!achievement.unlockMethods.includes("gps")}><LocateFixed size={16} /> Validar GPS</button><button type="button" className="secondary-button" onClick={onCamera}><Camera size={16} /> Cámara</button><button type="button" className="primary-button" onClick={onToggle}>{unlocked ? "Quitar estampa" : "Estampar manualmente"}</button></div><p className="data-note">NIOLI no utiliza reconocimiento visual. La validación disponible es manual, GPS real o foto asociada.</p></section></div>;
}
