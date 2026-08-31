import {
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  House,
  LogOut,
  MapPinned,
  PlaneTakeoff,
  Sparkles,
  Stamp,
  Luggage,
  Users,
} from "lucide-react";
import Image from "next/image";
import type { ComponentType } from "react";

import type { NioliBrandAssets } from "@/lib/nioli/brand";
import type { CompanionProfile, CompanionProgress, CountryTheme, FeatureId, Trip } from "@/types/travel";

interface SideNavigationProps {
  trip: Trip;
  theme: CountryTheme;
  active: FeatureId;
  companionEnabled: boolean;
  companionProfile?: CompanionProfile;
  companionProgress?: CompanionProgress;
  onNavigate: (feature: FeatureId) => void;
  onToggleCompanion: () => void;
  cloudMode?: boolean;
  canManageAccess?: boolean;
  onLogout?: () => Promise<void>;
  brand: NioliBrandAssets;
}

const journeyItems: Array<{
  id: FeatureId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
}> = [
  { id: "dashboard", label: "Inicio", icon: House },
  { id: "itinerary", label: "Itinerario", icon: CalendarDays },
  { id: "map", label: "Mapa", icon: MapPinned },
  { id: "reservations", label: "Reservas", icon: PlaneTakeoff },
  { id: "expenses", label: "Finanzas", icon: CircleDollarSign },
  { id: "adventure", label: "Nioli Passport", icon: Stamp },
];

export function SideNavigation({
  trip,
  theme,
  active,
  companionEnabled,
  companionProfile,
  companionProgress,
  onNavigate,
  onToggleCompanion,
  cloudMode,
  canManageAccess,
  onLogout,
  brand,
}: SideNavigationProps) {
  const unlocked = trip.achievements.filter((achievement) => achievement.unlockedBy.length > 0).length;
  const companionLevel = companionProgress?.level ?? 1 + Math.floor(unlocked / 4);
  const companionPercent = companionProgress ? companionProgress.xp % 100 : trip.achievements.length > 0 ? Math.round((unlocked / trip.achievements.length) * 100) : 0;
  const companionName = companionProfile?.name ?? "Brady";
  const showTripManager = !cloudMode || canManageAccess;
  const tripManagerLabel = cloudMode ? "Participantes" : "Mis viajes";

  return (
    <aside className="side-navigation">
      <div className="brand-lockup">
        <Image className="brand-lockup-image" src={brand.logoHorizontal} alt="NIOLI · Tu pasaporte al mundo" width={700} height={225} sizes="190px" priority />
      </div>

      <div className="trip-mini-card" aria-label={`Viaje activo: ${trip.name}`}>
        <span className="trip-mini-flag"><b>{theme.countryCode}</b></span>
        <span>
          <small>{trip.countryId === "japan" ? "Travel pass" : "Viaje activo"}</small>
          <strong>{trip.name}</strong>
          <em>{trip.countdownDays} días · {trip.dateRange}</em>
        </span>
        {trip.countryId === "japan" ? <span className="trip-mini-jp-mark" aria-hidden="true">日</span> : <Luggage size={20} aria-hidden="true" />}
      </div>

      <nav aria-label="Navegación del viaje" className="side-nav-items">
        <p>Tu viaje</p>
        {journeyItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              type="button"
              key={item.id}
              className={isActive ? "side-nav-button active" : "side-nav-button"}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <span className="side-nav-icon"><Icon size={22} strokeWidth={isActive ? 2.25 : 1.85} aria-hidden={true} /></span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {showTripManager ? (
        <nav aria-label="Viajeros y acceso" className="side-nav-items side-nav-secondary">
          <p>Viajeros</p>
          <button
            type="button"
            className={active === "trips" ? "side-nav-button active" : "side-nav-button"}
            aria-current={active === "trips" ? "page" : undefined}
            onClick={() => onNavigate("trips")}
          >
            <span className="side-nav-icon"><Users size={22} strokeWidth={active === "trips" ? 2.25 : 1.85} aria-hidden="true" /></span>
            <span>{tripManagerLabel}</span>
          </button>
        </nav>
      ) : null}

      <button
        type="button"
        className={companionEnabled ? "companion-toggle enabled" : "companion-toggle"}
        aria-pressed={companionEnabled}
        onClick={onToggleCompanion}
      >
        <span className="companion-bolt"><Sparkles size={19} aria-hidden="true" /></span>
        <span className="companion-copy">
          <small>Compañero · nivel {companionLevel}</small>
          <strong>{companionEnabled ? `${companionName} listo para explorar` : "Activar compañero"}</strong>
          <i><b style={{ width: `${companionPercent}%` }} /></i>
          <em>{companionProgress?.xp ?? unlocked * 25} XP · {unlocked} sellos</em>
        </span>
        {companionEnabled ? <BadgeCheck size={20} aria-label="Compañero activo" /> : null}
      </button>

      {cloudMode && onLogout ? (
        <button type="button" className="side-nav-button logout-button" onClick={() => void onLogout()}>
          <span className="side-nav-icon"><LogOut size={21} /></span>
          <span>Cambiar usuario</span>
        </button>
      ) : null}
    </aside>
  );
}

