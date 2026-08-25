import { Bell, ChevronDown, Menu } from "lucide-react";

import type { CountryTheme, Trip } from "@/types/travel";

interface TopBarProps {
  trip: Trip;
  theme: CountryTheme;
  activeParticipantId: string;
  onSelectParticipant: (participantId: string) => void;
  onOpenCountries: () => void;
}

export function TopBar({ trip, theme, activeParticipantId, onSelectParticipant, onOpenCountries }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="mobile-brand">
        <button type="button" className="icon-button menu-button" aria-label="Abrir navegación"><Menu size={20} aria-hidden="true" /></button>
        <span className="brand-mark small" aria-hidden="true">旅</span>
        <strong>Travel OS</strong>
      </div>

      <button type="button" className="country-trigger" onClick={onOpenCountries}>
        <span>{theme.flag}</span>
        <span><small>Viaje activo</small><strong>{trip.name}</strong></span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      <div className="top-actions">
        <button type="button" className="icon-button notification-button" aria-label="Notificaciones"><Bell size={19} aria-hidden="true" /></button>
        <div className="traveler-stack" aria-label="Participante activo">
          {trip.participants.map((participant) => (
            <button
              type="button"
              key={participant.id}
              className={participant.id === activeParticipantId ? "active" : ""}
              style={{ backgroundColor: participant.color }}
              title={`Usar Travel OS como ${participant.name}`}
              aria-label={`Cambiar a ${participant.name}`}
              aria-pressed={participant.id === activeParticipantId}
              onClick={() => onSelectParticipant(participant.id)}
            >
              {participant.initials}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
