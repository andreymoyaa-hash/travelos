"use client";

import Image from "next/image";
import { type FormEvent, useMemo, useState } from "react";
import { Camera, Check, Gift, Hand, LocateFixed, LockKeyhole, MapPin, Plus, Sparkles, Trophy, X } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Achievement, CompanionProfile, CompanionProgress, CountryTheme, GeoPosition, LocationStatus, Participant, TravelPhoto, Trip } from "@/types/travel";

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

export function AdventureView({ trip, theme, achievements, participant, photos, position, locationStatus, locationError, companionProfile, companionProgress, onRequestLocation, onToggleAchievement, onAddAchievement, onCompanionAction, onOpenCamera }: AdventureViewProps) {
  const [selectedId, setSelectedId] = useState<string>();
  const [customOpen, setCustomOpen] = useState(false);
  const unlocked = achievements.filter((achievement) => achievement.unlockedBy.includes(participant.id)).length;
  const progress = achievements.length ? (unlocked / achievements.length) * 100 : 0;
  const groups = useMemo(() => Array.from(new Set(achievements.map((achievement) => achievement.city ?? achievement.location ?? "General"))).map((location) => ({ location, achievements: achievements.filter((achievement) => (achievement.city ?? achievement.location ?? "General") === location) })), [achievements]);
  const selected = achievements.find((achievement) => achievement.id === selectedId);

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
      <SectionHeading eyebrow={`Travel Passport · ${participant.name}`} title="Colecciona recuerdos, no tareas" description="Cada sello pertenece a este viaje y se valida de forma manual, con GPS real o mediante una fotografía asociada." action={<div className="heading-actions"><button type="button" className="secondary-button" onClick={() => setCustomOpen(true)}><Plus size={17} /> Sello personalizado</button><button type="button" className="primary-button" onClick={() => onOpenCamera()}><Camera size={17} /> Tomar foto</button></div>} />

      <section className={`passport-cover ${theme.decorativeStyle}`}>
        <div className="passport-cover-mark">{theme.landmark}</div>
        <div><span className="adventure-label"><Sparkles size={14} /> {theme.labels.passport}</span><h2>{trip.name}</h2><p>{theme.description}</p><div className="collection-progress"><span><strong>{unlocked}</strong> de {achievements.length} sellos</span><ProgressBar value={progress} color={theme.colors.highlight} label="Sellos desbloqueados" /></div></div>
        <div className="passport-owner"><small>Viajero</small><strong>{participant.name}</strong><span>{Math.round(progress)}% completo</span></div>
      </section>

      <div className="adventure-tools"><div><LocateFixed size={19} /><span><strong>{position ? "Ubicación disponible" : "Ubicación pendiente"}</strong><small>{position ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : locationError ?? "El GPS sólo se solicita al pulsar el botón."}</small></span></div><button type="button" className="secondary-button" disabled={locationStatus === "requesting"} onClick={() => void onRequestLocation()}>{locationStatus === "requesting" ? "Buscando…" : "Usar mi ubicación"}</button></div>

      <div className="passport-layout">
        <section className="passport-pages">
          <div className="subsection-heading"><div><p className="eyebrow">Páginas del pasaporte</p><h2>Sellos por ciudad o región</h2></div><span className="collection-count"><Trophy size={16} /> {unlocked}/{achievements.length}</span></div>
          {groups.length ? groups.map((group) => {
            const groupUnlocked = group.achievements.filter((achievement) => achievement.unlockedBy.includes(participant.id)).length;
            return <section className="passport-city-page" key={group.location}><header><div><p className="eyebrow">Destino</p><h3>{group.location}</h3></div><span>{groupUnlocked} / {group.achievements.length} sellos</span></header><ProgressBar value={group.achievements.length ? (groupUnlocked / group.achievements.length) * 100 : 0} color={theme.colors.accent} label={`Progreso de ${group.location}`} /><div className="stamp-grid">{group.achievements.map((achievement) => {
              const isUnlocked = achievement.unlockedBy.includes(participant.id);
              const linkedPhoto = photos.find((photo) => photo.achievementId === achievement.id);
              return <button type="button" key={achievement.id} className={isUnlocked ? "passport-stamp-card unlocked" : "passport-stamp-card"} style={{ "--achievement-color": achievement.color } as React.CSSProperties} onClick={() => setSelectedId(achievement.id)}><span className="achievement-icon">{achievement.icon}</span><span className="achievement-status">{isUnlocked ? <Check size={13} /> : <LockKeyhole size={13} />}</span><strong>{achievement.title}</strong><small>{isUnlocked ? achievement.unlockedAt?.[participant.id] ? new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(new Date(achievement.unlockedAt[participant.id])) : `Desbloqueado por ${participant.name}` : "??? · Bloqueado"}</small>{linkedPhoto ? <span className="stamp-photo-thumb"><Image src={linkedPhoto.dataUrl} alt="Recuerdo asociado" fill sizes="80px" unoptimized /></span> : null}</button>;
            })}</div></section>;
          }) : <div className="empty-state"><span>✦</span><h2>Tu pasaporte está listo</h2><p>Crea el primer sello personalizado para este viaje.</p><button type="button" className="primary-button" onClick={() => setCustomOpen(true)}>Crear sello</button></div>}
        </section>

        <aside className="companion-card companion-v2">
          <div className="companion-portrait" aria-hidden="true"><span className="companion-face">{companionProfile.icon}</span></div>
          <p className="eyebrow">Companion · nivel {companionProgress.level}</p><h2>{companionProfile.name}</h2><p>{companionProgress.lastMessage ?? "¿Qué exploramos primero?"}</p>
          <div className="companion-mood"><span>Estado</span><strong>{companionProgress.mood === "excited" ? "Emocionado" : companionProgress.mood === "happy" ? "Feliz" : companionProgress.mood === "resting" ? "Descansando" : "Curioso"}</strong></div>
          <div className="companion-xp"><span><small>XP</small><strong>{companionProgress.xp}</strong></span><ProgressBar value={companionProgress.xp % 100} color={theme.colors.highlight} label="Progreso del companion" /></div>
          <div className="companion-actions"><button type="button" onClick={() => onCompanionAction("snack")}><Gift size={15} /> Dar snack</button><button type="button" onClick={() => onCompanionAction("hello")}><Hand size={15} /> Saludar</button><button type="button" onClick={() => onCompanionAction("memory")}><Camera size={15} /> Ver recuerdo</button><button type="button" onClick={() => onCompanionAction("explore")}><MapPin size={15} /> Explorar</button></div>
        </aside>
      </div>

      <section className="photo-album" aria-labelledby="album-title"><div className="subsection-heading"><div><p className="eyebrow">Álbum personal</p><h2 id="album-title">Fotos de {participant.name}</h2></div><span className="collection-count"><Camera size={16} /> {photos.length}</span></div>{photos.length ? <div className="photo-grid">{photos.map((photo) => <figure key={photo.id}><Image src={photo.dataUrl} alt={photo.note || `Recuerdo de ${participant.name}`} fill sizes="(max-width: 720px) 45vw, 230px" unoptimized /><figcaption>{photo.note || new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(photo.createdAt))}</figcaption></figure>)}</div> : <div className="empty-state compact"><Camera size={28} /><h2>El álbum está vacío</h2><p>Toma el primer recuerdo de {participant.name}.</p></div>}</section>

      {selected ? <StampDetail achievement={selected} participant={participant} photos={photos} position={position} onClose={() => setSelectedId(undefined)} onToggle={() => onToggleAchievement(selected.id)} onCamera={() => onOpenCamera(selected.id)} onGps={onRequestLocation} /> : null}
      {customOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setCustomOpen(false)}><section className="expense-modal" role="dialog" aria-modal="true" aria-labelledby="custom-stamp-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Pasaporte editable</p><h2 id="custom-stamp-title">Nuevo sello</h2></div><button type="button" className="icon-button" onClick={() => setCustomOpen(false)} aria-label="Cerrar"><X size={20} /></button></header><form onSubmit={addCustomStamp}><div className="form-grid"><label>Icono<input name="icon" defaultValue="✦" maxLength={4} /></label><label>Rareza<select name="rarity" defaultValue="common"><option value="common">Común</option><option value="special">Especial</option><option value="rare">Raro</option></select></label></div><label>Nombre<input name="title" required autoFocus /></label><label>Ciudad o región<input name="location" required /></label><label>Descripción<textarea name="description" rows={3} required /></label><button type="submit" className="primary-button full-width">Crear sello bloqueado</button></form></section></div> : null}
    </div>
  );
}

function StampDetail({ achievement, participant, photos, position, onClose, onToggle, onCamera, onGps }: { achievement: Achievement; participant: Participant; photos: TravelPhoto[]; position?: GeoPosition; onClose: () => void; onToggle: () => void; onCamera: () => void; onGps: () => Promise<GeoPosition | undefined> }) {
  const unlocked = achievement.unlockedBy.includes(participant.id);
  const photo = photos.find((item) => item.achievementId === achievement.id);
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="expense-modal stamp-detail-modal" role="dialog" aria-modal="true" aria-labelledby="stamp-detail-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">{achievement.custom ? "Sello personalizado" : "Sello del viaje"}</p><h2 id="stamp-detail-title">{achievement.title}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header><div className={unlocked ? "stamp-detail-seal unlocked" : "stamp-detail-seal"}>{achievement.icon}</div><p>{achievement.description}</p><dl><div><dt>Ciudad / región</dt><dd>{achievement.city ?? achievement.location}</dd></div><div><dt>Condición</dt><dd>{achievement.unlockMethods.map((method) => method === "photo" ? "Foto" : method === "gps" ? "GPS" : "Manual").join(" · ")}</dd></div><div><dt>Estado</dt><dd>{unlocked ? `Desbloqueado por ${participant.name}` : "Bloqueado"}</dd></div><div><dt>Ubicación</dt><dd>{position ? "GPS disponible" : "No solicitada"}</dd></div></dl>{photo ? <figure className="stamp-detail-photo"><Image src={photo.dataUrl} alt="Foto asociada al sello" fill sizes="500px" unoptimized /></figure> : null}<div className="stamp-detail-actions"><button type="button" className="secondary-button" onClick={() => void onGps()} disabled={!achievement.unlockMethods.includes("gps")}><LocateFixed size={16} /> Validar GPS</button><button type="button" className="secondary-button" onClick={onCamera}><Camera size={16} /> Cámara</button><button type="button" className="primary-button" onClick={onToggle}>{unlocked ? "Marcar bloqueado" : "Validar manualmente"}</button></div><p className="data-note">Travel OS no utiliza reconocimiento visual. La validación disponible es manual, GPS real o foto asociada.</p></section></div>;
}
