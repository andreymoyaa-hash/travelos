"use client";

import Image from "next/image";
import { useState } from "react";
import { Camera, Check, LocateFixed, LockKeyhole, MapPin, Sparkles, Trophy } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { PhotoCapture } from "@/features/photos/photo-capture";
import type { Achievement, AchievementCategory, GeoPosition, LocationStatus, Participant, TravelPhoto } from "@/types/travel";

interface AdventureViewProps {
  achievements: Achievement[];
  participant: Participant;
  photos: TravelPhoto[];
  position?: GeoPosition;
  locationStatus: LocationStatus;
  locationError?: string;
  companionEnabled: boolean;
  onRequestLocation: () => Promise<GeoPosition | undefined>;
  onSavePhoto: (photo: TravelPhoto) => void;
  onToggleAchievement: (id: string) => void;
  onToggleCompanion: () => void;
}

const categoryLabels: Record<AchievementCategory, string> = {
  travel: "Viaje",
  transport: "Transporte",
  kyoto: "Kyoto",
  food: "Comida",
  geek: "Geek",
  entertainment: "Entretenimiento",
};

const categoryOrder = Object.keys(categoryLabels) as AchievementCategory[];

export function AdventureView({
  achievements,
  participant,
  photos,
  position,
  locationStatus,
  locationError,
  companionEnabled,
  onRequestLocation,
  onSavePhoto,
  onToggleAchievement,
  onToggleCompanion,
}: AdventureViewProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const unlocked = achievements.filter((achievement) => achievement.unlockedBy.includes(participant.id)).length;

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow={`Adventure mode · ${participant.name}`}
        title="Colecciona el viaje"
        description="Cada participante guarda sus propios logros y recuerdos. Puedes cambiar de persona en la barra superior."
        action={<button type="button" className="primary-button" onClick={() => setCameraOpen(true)}><Camera size={17} /> Tomar foto</button>}
      />

      <section className="adventure-hero">
        <div className="adventure-orb orb-one" /><div className="adventure-orb orb-two" />
        <div className="adventure-copy">
          <span className="adventure-label"><Sparkles size={14} /> Colección de {participant.name}</span>
          <h2>Tu pasaporte de aventuras</h2>
          <p>Desbloquea sellos manualmente o enlaza una foto. Los logros con GPS ya están preparados para validar ubicaciones.</p>
          <div className="collection-progress"><span><strong>{unlocked}</strong> de {achievements.length} logros</span><ProgressBar value={(unlocked / achievements.length) * 100} color="#ffd850" label="Logros desbloqueados" /></div>
        </div>
        <div className="passport-stamp" aria-hidden="true"><span>日本</span><strong>2026</strong><small>ADVENTURE</small></div>
      </section>

      <div className="adventure-tools">
        <div><LocateFixed size={19} /><span><strong>{position ? "Ubicación disponible" : "Ubicación pendiente"}</strong><small>{position ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : locationError ?? "Se solicitará permiso sólo al pulsar el botón."}</small></span></div>
        <button type="button" className="secondary-button" disabled={locationStatus === "requesting"} onClick={() => void onRequestLocation()}>{locationStatus === "requesting" ? "Buscando…" : "Usar mi ubicación"}</button>
      </div>

      <div className="adventure-layout">
        <section>
          <div className="subsection-heading"><div><p className="eyebrow">Logros del viaje</p><h2>Historias por vivir</h2></div><span className="collection-count"><Trophy size={16} /> {unlocked}/{achievements.length}</span></div>
          <p className="data-note">Pulsa un logro para marcarlo manualmente. Una foto relacionada también lo desbloquea para {participant.name}.</p>

          <div className="achievement-groups">
            {categoryOrder.map((category) => {
              const group = achievements.filter((achievement) => achievement.category === category);
              return (
                <section className="achievement-group" key={category} aria-labelledby={`achievement-${category}`}>
                  <header><h3 id={`achievement-${category}`}>{categoryLabels[category]}</h3><span>{group.filter((item) => item.unlockedBy.includes(participant.id)).length}/{group.length}</span></header>
                  <div className="achievement-grid">
                    {group.map((achievement) => {
                      const isUnlocked = achievement.unlockedBy.includes(participant.id);
                      return (
                        <button type="button" key={achievement.id} className={isUnlocked ? "achievement-card unlocked" : "achievement-card"} style={{ "--achievement-color": achievement.color } as React.CSSProperties} onClick={() => onToggleAchievement(achievement.id)} aria-pressed={isUnlocked}>
                          <span className="achievement-icon">{achievement.icon}</span>
                          <span className="achievement-status">{isUnlocked ? <Check size={13} /> : <LockKeyhole size={13} />}</span>
                          <strong>{achievement.title}</strong><p>{achievement.description}</p>
                          <span className="achievement-location"><MapPin size={12} /> {achievement.location}</span>
                          <div className="achievement-methods">{achievement.unlockMethods.map((method) => <small key={method}>{method === "gps" ? "GPS" : method === "photo" ? "Foto" : "Manual"}</small>)}</div>
                          <div className="achievement-progress"><i style={{ width: isUnlocked ? "100%" : "0%" }} /></div>
                          <small>{isUnlocked ? `Sello de ${participant.name}` : "Bloqueado"}</small>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <aside className="companion-card">
          <div className="companion-portrait" aria-hidden="true"><span className="companion-ear ear-left" /><span className="companion-ear ear-right" /><span className="companion-face">•ᴗ•</span><i>⚡</i></div>
          <p className="eyebrow">Compañero opcional</p><h2>Pikachu viaja contigo</h2><p>Una capa visual alegre que celebra tus avances sin cambiar las herramientas principales.</p>
          <div className="companion-mood"><span>Estado</span><strong>{companionEnabled ? "Listo para explorar" : "Descansando"}</strong></div>
          <button type="button" className={companionEnabled ? "secondary-button full-width" : "primary-button full-width"} onClick={onToggleCompanion}>{companionEnabled ? "Dar un descanso" : "Invitar al viaje"}</button>
        </aside>
      </div>

      <section className="photo-album" aria-labelledby="album-title">
        <div className="subsection-heading"><div><p className="eyebrow">Álbum personal</p><h2 id="album-title">Fotos de {participant.name}</h2></div><span className="collection-count"><Camera size={16} /> {photos.length}</span></div>
        {photos.length ? (
          <div className="photo-grid">{photos.map((photo) => {
            const linkedAchievement = achievements.find((achievement) => achievement.id === photo.achievementId);
            return <article key={photo.id}><div><Image src={photo.dataUrl} alt={`Recuerdo de ${participant.name}`} fill sizes="(max-width: 720px) 45vw, 240px" unoptimized /></div><p>{new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(photo.createdAt))}</p><small>{linkedAchievement ? `${linkedAchievement.icon} ${linkedAchievement.title}` : "Recuerdo libre"}{photo.location ? " · Con ubicación" : ""}</small></article>;
          })}</div>
        ) : <div className="empty-state compact"><span>📷</span><h2>Aún no hay fotos</h2><p>Usa “Tomar foto” para guardar el primer recuerdo de {participant.name}.</p></div>}
      </section>

      <PhotoCapture open={cameraOpen} participant={participant} achievements={achievements} position={position} onClose={() => setCameraOpen(false)} onSave={onSavePhoto} />
    </div>
  );
}
