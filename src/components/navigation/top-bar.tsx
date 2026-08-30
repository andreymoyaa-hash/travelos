import { ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";

import type { NioliBrandAssets } from "@/lib/nioli/brand";
import type { CountryTheme, Trip } from "@/types/travel";

interface TopBarProps {
  trip: Trip;
  theme: CountryTheme;
  activeParticipantId: string;
  onSelectParticipant: (participantId: string) => void;
  onOpenCountries?: () => void;
  participantLocked?: boolean;
  onLogout?: () => Promise<void>;
  brand: NioliBrandAssets;
}

export function TopBar({ trip, theme, activeParticipantId, onSelectParticipant, onOpenCountries, participantLocked, onLogout, brand }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="mobile-brand">
        <Image className="mobile-brand-seal" src={brand.seal} alt="" width={320} height={320} sizes="38px" aria-hidden="true" />
        <span><strong>NIOLI</strong><small>Tu pasaporte al mundo</small></span>
      </div>

      <button type="button" className="country-trigger" onClick={onOpenCountries} disabled={!onOpenCountries}>
        <span className="country-code-chip">{theme.countryCode}</span>
        <span><small>Viaje activo</small><strong>{trip.name}</strong></span>
        {onOpenCountries ? <ChevronDown size={17} aria-hidden="true" /> : null}
      </button>

      <div className="top-actions">
        <div className="traveler-stack" aria-label="Participante activo">
          {trip.participants.map((participant) => (
            <button
              type="button"
              key={participant.id}
              className={participant.id === activeParticipantId ? "active" : ""}
              style={{ backgroundColor: participant.color }}
              title={`Usar NIOLI como ${participant.name}`}
              aria-label={`Cambiar a ${participant.name}`}
              aria-pressed={participant.id === activeParticipantId}
              onClick={() => { if (!participantLocked) onSelectParticipant(participant.id); }}
              disabled={participantLocked && participant.id !== activeParticipantId}
            >
              {participant.initials}
            </button>
          ))}
        </div>
        {onLogout ? <button type="button" className="icon-button topbar-logout" aria-label="Cambiar usuario" title="Cambiar usuario" onClick={() => void onLogout()}><LogOut size={19} /></button> : null}
      </div>
    </header>
  );
}
