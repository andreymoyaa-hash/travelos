import {
  LayoutDashboard,
  Map,
  PlaneTakeoff,
  Route,
  Stamp,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";

import type { FeatureId } from "@/types/travel";

interface BottomNavigationProps {
  active: FeatureId;
  onNavigate: (feature: FeatureId) => void;
}

const items: Array<{
  id: FeatureId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
}> = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "itinerary", label: "Ruta", icon: Route },
  { id: "expenses", label: "Wallet", icon: WalletCards },
  { id: "reservations", label: "Reservas", icon: PlaneTakeoff },
  { id: "map", label: "Mapa", icon: Map },
  { id: "adventure", label: "Passport", icon: Stamp },
];

export function BottomNavigation({ active, onNavigate }: BottomNavigationProps) {
  return (
    <nav aria-label="Navegación móvil" className="bottom-navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            type="button"
            key={item.id}
            className={isActive ? "bottom-nav-button active" : "bottom-nav-button"}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} aria-hidden={true} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
