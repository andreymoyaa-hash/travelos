import {
  CalendarDays,
  CircleDollarSign,
  Compass,
  LayoutDashboard,
  Map,
  PlaneTakeoff,
  Sparkles,
} from "lucide-react";
import type { ComponentType } from "react";

import type { FeatureId, Trip } from "@/types/travel";

interface SideNavigationProps {
  trip: Trip;
  active: FeatureId;
  companionEnabled: boolean;
  onNavigate: (feature: FeatureId) => void;
  onToggleCompanion: () => void;
}

const navigationItems: Array<{
  id: FeatureId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
}> = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "itinerary", label: "Itinerario", icon: CalendarDays },
  { id: "expenses", label: "Finanzas", icon: CircleDollarSign },
  { id: "reservations", label: "Reservas", icon: PlaneTakeoff },
  { id: "map", label: "Mapa", icon: Map },
  { id: "adventure", label: "Aventura", icon: Compass },
];

export function SideNavigation({
  trip,
  active,
  companionEnabled,
  onNavigate,
  onToggleCompanion,
}: SideNavigationProps) {
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
        <span className="trip-mini-flag">🇯🇵</span>
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
        <span>
          <small>Compañero de viaje</small>
          <strong>{companionEnabled ? "Pikachu activo" : "Activar compañero"}</strong>
        </span>
        <Sparkles size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}
