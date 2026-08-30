"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Camera, Gift, Hand, LocateFixed, MapPin, Plus, Sparkles, Trophy, X } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { RouteMemoryTicket } from "@/components/cards/route-memory-ticket";
import { SectionHeading } from "@/components/ui/section-heading";
import { PassportStampMark } from "@/features/achievements/passport-stamp-mark";
import { getCountryExperience } from "@/lib/nioli/country-experience";
import { officialBradyAsset, hasOfficialCountryAssets } from "@/lib/nioli/official-assets";
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
  const [recentlyUnlockedId, setRecentlyUnlockedId] = useState<string>();
  const unlocked = achievements.filter((achievement) => achievement.unlockedBy.includes(participant.id)).length;
  const progress = achievements.length ? (unlocked / achievements.length) * 100 : 0;
  const selected = achievements.find((achievement) => achievement.id === selectedId);
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
      <SectionHeading eyebrow={`Nioli Passport · ${participant.name}`} title="Colecciona recuerdos, no tareas" description="Cada sello pertenece a este viaje y se valida de forma manual, con GPS real o mediante una fotografía asociada." action={<div className="heading-actions"><button type="button" className="secondary-button" onClick={() => setCustomOpen(true)}><Plus size={17} /> Sello personalizado</button><button type="button" className="primary-button" onClick={() => onOpenCamera()}><Camera size={17} /> Tomar foto</button></div>} />

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

      <section className="photo-album" aria-labelledby="album-title"><div className="subsection-heading"><div><p className="eyebrow">Álbum personal</p><h2 id="album-title">Fotos de {participant.name}</h2></div><span className="collection-count"><Camera size={16} /> {photos.length}</span></div>{photos.length ? <div className="photo-grid">{photos.map((photo) => <figure key={photo.id}><Image src={photo.dataUrl} alt={photo.note || `Recuerdo de ${participant.name}`} fill sizes="(max-width: 720px) 45vw, 230px" unoptimized /><figcaption>{photo.note || new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(photo.createdAt))}</figcaption></figure>)}</div> : <div className="empty-state compact"><Camera size={28} /><h2>El álbum está vacío</h2><p>Toma el primer recuerdo de {participant.name}.</p></div>}</section>

      {selected ? <StampDetail achievement={selected} participant={participant} photos={photos} position={position} recentlyUnlocked={recentlyUnlockedId === selected.id} onClose={() => setSelectedId(undefined)} onToggle={() => { const wasUnlocked = selected.unlockedBy.includes(participant.id); if (!wasUnlocked) setRecentlyUnlockedId(selected.id); onToggleAchievement(selected.id); }} onCamera={() => onOpenCamera(selected.id)} onGps={onRequestLocation} /> : null}
      {customOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setCustomOpen(false)}><section className="expense-modal" role="dialog" aria-modal="true" aria-labelledby="custom-stamp-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Pasaporte editable</p><h2 id="custom-stamp-title">Nuevo sello</h2></div><button type="button" className="icon-button" onClick={() => setCustomOpen(false)} aria-label="Cerrar"><X size={20} /></button></header><form onSubmit={addCustomStamp}><div className="form-grid"><label>Icono<input name="icon" defaultValue="✦" maxLength={4} /></label><label>Rareza<select name="rarity" defaultValue="common"><option value="common">Común</option><option value="special">Especial</option><option value="rare">Raro</option></select></label></div><label>Nombre<input name="title" required autoFocus /></label><label>Ciudad o región<input name="location" required /></label><label>Descripción<textarea name="description" rows={3} required /></label><button type="submit" className="primary-button full-width">Crear sello bloqueado</button></form></section></div> : null}
    </div>
  );
}

function StampDetail({ achievement, participant, photos, position, recentlyUnlocked, onClose, onToggle, onCamera, onGps }: { achievement: Achievement; participant: Participant; photos: TravelPhoto[]; position?: GeoPosition; recentlyUnlocked?: boolean; onClose: () => void; onToggle: () => void; onCamera: () => void; onGps: () => Promise<GeoPosition | undefined> }) {
  const unlocked = achievement.unlockedBy.includes(participant.id);
  const photo = photos.find((item) => item.achievementId === achievement.id);
  const condition = achievement.unlockMethods.map((method) => method === "photo" ? "Foto" : method === "gps" ? "GPS" : "Manual").join(" · ");
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="expense-modal stamp-detail-modal" role="dialog" aria-modal="true" aria-labelledby="stamp-detail-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">{achievement.custom ? "Sello personalizado" : unlocked ? "Estampa obtenida" : "Sello por descubrir"}</p><h2 id="stamp-detail-title">{achievement.discovery === "secret" && !unlocked ? "Una experiencia te espera" : achievement.title}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header><div className="stamp-detail-stage"><PassportStampMark achievement={achievement} unlocked={unlocked} large recentlyUnlocked={recentlyUnlocked} />{unlocked ? <span className="stamp-detail-chak" aria-hidden="true">CHAK!</span> : null}</div><p className="stamp-detail-description">{unlocked ? achievement.description : achievement.hint ?? achievement.description}</p><dl><div><dt>Ciudad / región</dt><dd>{achievement.city ?? achievement.location}</dd></div><div><dt>Cómo se obtiene</dt><dd>{condition}</dd></div><div><dt>Estado</dt><dd>{unlocked ? `En el pasaporte de ${participant.name}` : "Aún no estampado"}</dd></div><div><dt>Ubicación</dt><dd>{position ? "GPS disponible" : "No solicitada"}</dd></div></dl>{photo ? <figure className="stamp-detail-photo"><Image src={photo.dataUrl} alt="Foto asociada al sello" fill sizes="500px" unoptimized /></figure> : null}{achievement.source ? <a className="stamp-source-link" href={achievement.source.url} target="_blank" rel="noreferrer">Referencia del destino · {achievement.source.label}</a> : null}<div className="stamp-detail-actions"><button type="button" className="secondary-button" onClick={() => void onGps()} disabled={!achievement.unlockMethods.includes("gps")}><LocateFixed size={16} /> Validar GPS</button><button type="button" className="secondary-button" onClick={onCamera}><Camera size={16} /> Cámara</button><button type="button" className="primary-button" onClick={onToggle}>{unlocked ? "Quitar estampa" : "Estampar manualmente"}</button></div><p className="data-note">NIOLI no utiliza reconocimiento visual. La validación disponible es manual, GPS real o foto asociada.</p></section></div>;
}
