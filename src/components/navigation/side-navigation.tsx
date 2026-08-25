import {
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  Map,
  PlaneTakeoff,
  Sparkles,
  Stamp,
  BaggageClaim,
} from "lucide-react";
import type { ComponentType } from "react";

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
}

const navigationItems: Array<{
  id: FeatureId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
}> = [
  { id: "trips", label: "Mis viajes", icon: BaggageClaim },
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "itinerary", label: "Itinerario", icon: CalendarDays },
  { id: "expenses", label: "Finanzas", icon: CircleDollarSign },
  { id: "reservations", label: "Reservas", icon: PlaneTakeoff },
  { id: "map", label: "Mapa", icon: Map },
  { id: "adventure", label: "Travel Passport", icon: Stamp },
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
}: SideNavigationProps) {
  const unlocked = trip.achievements.filter((achievement) => achievement.unlockedBy.length > 0).length;
  const companionLevel = companionProgress?.level ?? 1 + Math.floor(unlocked / 4);
  const companionPercent = companionProgress ? companionProgress.xp % 100 : trip.achievements.length > 0 ? Math.round((unlocked / trip.achievements.length) * 100) : 0;
  const companionName = companionProfile?.name ?? (trip.countryId === "japan" ? "Pikachu" : "Compañero Travel OS");

  return (
    <aside className="side-navigation">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          旅
        </span>
        <span>
          <strong>Travel OS</strong>
          <small>Viaja a tu manera</small>
        </span>
      </div>

      <div className="trip-mini-card">
        <span className="trip-mini-flag">{theme.flag}</span>
        <span>
          <small>Viaje activo</small>
          <strong>{trip.name}</strong>
          <em>{trip.countdownDays} días</em>
        </span>
      </div>

      <nav aria-label="Navegación principal" className="side-nav-items">
        <p>Tu viaje</p>
        {navigationItems.map((item) => {
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
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden={true} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className={companionEnabled ? "companion-toggle enabled" : "companion-toggle"}
        aria-pressed={companionEnabled}
        onClick={onToggleCompanion}
      >
        <span className="companion-bolt">⚡</span>
        <span className="companion-copy">
          <small>Compañero · nivel {companionLevel}</small>
          <strong>{companionEnabled ? `${companionName} listo para explorar` : "Activar compañero"}</strong>
          <i><b style={{ width: `${companionPercent}%` }} /></i>
          <em>{companionProgress?.xp ?? unlocked * 25} XP · {unlocked} sellos</em>
        </span>
        {companionEnabled ? <BadgeCheck size={18} aria-label="Compañero activo" /> : <Sparkles size={18} aria-hidden="true" />}
      </button>
    </aside>
  );
}
