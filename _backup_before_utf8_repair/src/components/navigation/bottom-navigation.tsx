"use client";

import {
  CalendarDays,
  CircleDollarSign,
  House,
  LogOut,
  MapPinned,
  Menu,
  PlaneTakeoff,
  Stamp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type { ComponentType } from "react";

import type { FeatureId } from "@/types/travel";

interface BottomNavigationProps {
  active: FeatureId;
  onNavigate: (feature: FeatureId) => void;
  showTrips?: boolean;
  tripsLabel?: string;
  onLogout?: () => Promise<void>;
}

const primaryItems: Array<{
  id: FeatureId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
}> = [
  { id: "dashboard", label: "Inicio", icon: House },
  { id: "itinerary", label: "Itinerario", icon: CalendarDays },
  { id: "map", label: "Mapa", icon: MapPinned },
  { id: "adventure", label: "Passport", icon: Stamp },
];

export function BottomNavigation({ active, onNavigate, showTrips = true, tripsLabel = "Mis viajes", onLogout }: BottomNavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = active === "expenses" || active === "reservations" || active === "trips";

  const navigate = (feature: FeatureId) => {
    setMoreOpen(false);
    onNavigate(feature);
  };

  return (
    <>
      <nav aria-label="Navegación móvil" className="bottom-navigation">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              type="button"
              key={item.id}
              className={isActive ? "bottom-nav-button active" : "bottom-nav-button"}
              aria-current={isActive ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <Icon size={23} strokeWidth={isActive ? 2.35 : 1.9} aria-hidden={true} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={moreOpen || moreActive ? "bottom-nav-button active" : "bottom-nav-button"}
          aria-expanded={moreOpen}
          aria-controls="nioli-mobile-more"
          onClick={() => setMoreOpen((current) => !current)}
        >
          <Menu size={24} strokeWidth={moreOpen || moreActive ? 2.35 : 1.9} aria-hidden={true} />
          <span>Más</span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="mobile-more-backdrop" role="presentation" onClick={() => setMoreOpen(false)}>
          <section id="nioli-mobile-more" className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Más opciones" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <p className="eyebrow">Tu viaje</p>
                <h2>Más opciones</h2>
              </div>
              <button type="button" className="icon-button" aria-label="Cerrar menú" onClick={() => setMoreOpen(false)}><X size={22} /></button>
            </header>
            <div className="mobile-more-grid">
              <button type="button" className={active === "reservations" ? "mobile-more-option active" : "mobile-more-option"} onClick={() => navigate("reservations")}>
                <PlaneTakeoff size={23} />
                <span><strong>Reservas</strong><small>Vuelos, hoteles y entradas</small></span>
              </button>
              <button type="button" className={active === "expenses" ? "mobile-more-option active" : "mobile-more-option"} onClick={() => navigate("expenses")}>
                <CircleDollarSign size={23} />
                <span><strong>Finanzas</strong><small>Presupuesto y gastos</small></span>
              </button>
              {showTrips ? (
                <button type="button" className={active === "trips" ? "mobile-more-option active" : "mobile-more-option"} onClick={() => navigate("trips")}>
                  <Users size={23} />
                  <span><strong>{tripsLabel}</strong><small>Acceso y viajeros</small></span>
                </button>
              ) : null}
              {onLogout ? (
                <button type="button" className="mobile-more-option danger" onClick={() => { setMoreOpen(false); void onLogout(); }}>
                  <LogOut size={23} />
                  <span><strong>Cambiar usuario</strong><small>Volver al PIN de NIOLI</small></span>
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
