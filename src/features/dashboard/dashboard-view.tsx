import { ArrowRight, CalendarDays, CircleDollarSign, Clock3, MapPin, Navigation, Plane, Sparkles } from "lucide-react";

import { MetricCard } from "@/components/cards/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatMoney } from "@/lib/format";
import type { ActivityCategory, CountryTheme, FeatureId, Participant, Trip } from "@/types/travel";

interface DashboardViewProps {
  trip: Trip;
  theme: CountryTheme;
  participant: Participant;
  spent: number;
  onNavigate: (feature: FeatureId) => void;
}

const activityIcons: Record<ActivityCategory, string> = {
  travel: "✈️",
  transport: "🚄",
  food: "🍜",
  geek: "👾",
  shopping: "🛍️",
  culture: "⛩️",
  temple: "🏯",
  photography: "📷",
  nature: "🌿",
  viewpoint: "🌇",
  gaming: "🎮",
  anime: "✨",
  "theme-park": "🎢",
  leisure: "✨",
};

export function DashboardView({ trip, theme, participant, spent, onNavigate }: DashboardViewProps) {
  const remaining = trip.budget.amount - spent;
  const budgetPercent = trip.budget.amount > 0 ? (spent / trip.budget.amount) * 100 : 0;
  const nextReservation = trip.reservations[0];
  const featuredDay = trip.itinerary[0];
  const unlocked = trip.achievements.filter((achievement) => achievement.unlockedBy.includes(participant.id)).length;

  return (
    <div className="view-stack dashboard-view">
      <header className="welcome-row">
        <div>
          <p className="eyebrow">Panel personal</p>
          <h1>Konnichiwa, {participant.name} <span aria-hidden="true">👋</span></h1>
          <p>Tu aventura toma forma. Esto es lo que sigue.</p>
        </div>
        <button type="button" className="quiet-button" onClick={() => onNavigate("itinerary")}>Ver plan completo <ArrowRight size={16} aria-hidden="true" /></button>
      </header>

      <section className="trip-hero" aria-labelledby="trip-hero-title">
        <div className="hero-pattern" aria-hidden="true"><span className="sun-disc" /><span className="mountain mountain-one" /><span className="mountain mountain-two" /><span className="torii-gate"><i /><b /></span></div>
        <div className="trip-hero-content">
          <div className="hero-kicker"><span>{theme.flag}</span> Tu próxima aventura</div>
          <h2 id="trip-hero-title">{trip.name}</h2>
          <p>{trip.dateRange} · {trip.participants.length} participantes</p>
          <div className="route-line" aria-label={`Ruta: ${trip.route.join(", ")}`}>
            {trip.route.map((place, index) => (
              <div key={place} className="route-stop"><span className={index === trip.route.length - 1 ? "route-dot destination" : "route-dot"} /><small>{place}</small>{index < trip.route.length - 1 ? <i /> : null}</div>
            ))}
          </div>
        </div>
        <div className="countdown-block"><span>Faltan</span><strong>{trip.countdownDays}</strong><small>días</small><div className="countdown-plane"><Plane size={22} aria-hidden="true" /></div></div>
      </section>

      <div className="dashboard-grid primary-dashboard-grid">
        <article className="surface-card next-event-card">
          <header className="card-header-row">
            <div><p className="eyebrow">Próxima reserva</p><h2>{nextReservation?.title ?? "Organiza el primer detalle"}</h2></div>
            {nextReservation ? <span className="status-pill"><span /> {nextReservation.status === "confirmed" ? "Confirmado" : "Pendiente"}</span> : null}
          </header>
          {nextReservation ? (
            <div className="dashboard-reservation-summary">
              <span className="soft-icon"><CalendarDays size={22} /></span>
              <div><strong>{nextReservation.provider}</strong><p>{nextReservation.date} · {nextReservation.time} · {nextReservation.code}</p><small>{nextReservation.subtitle}</small></div>
            </div>
          ) : (
            <div className="dashboard-empty"><CalendarDays size={28} /><div><strong>No tienes reservas registradas</strong><p>Añade vuelos, hoteles, trenes o entradas cuando tengas los datos confirmados.</p></div></div>
          )}
          <footer className="boarding-meta"><button type="button" onClick={() => onNavigate("reservations")}>{nextReservation ? "Ver reserva" : "Añadir reserva"} <ArrowRight size={14} aria-hidden="true" /></button></footer>
        </article>

        <article className="surface-card budget-card">
          <header className="card-header-row"><div><p className="eyebrow">Presupuesto disponible</p><h2>{trip.budget.amount > 0 ? formatMoney(remaining, trip.budget.currency) : "Sin definir"}</h2></div><div className="soft-icon"><CircleDollarSign size={21} aria-hidden="true" /></div></header>
          <ProgressBar value={Math.min(budgetPercent, 100)} label="Presupuesto utilizado" />
          <div className="budget-labels"><span>{formatMoney(spent, trip.budget.currency)} gastado</span><span>{Math.round(budgetPercent)}% del total</span></div>
          <button type="button" className="text-link" onClick={() => onNavigate("expenses")}>Abrir finanzas <ArrowRight size={15} aria-hidden="true" /></button>
        </article>
      </div>

      <section>
        <div className="subsection-heading"><div><p className="eyebrow">Vista rápida</p><h2>Tu viaje, bajo control</h2></div></div>
        <div className="metrics-grid">
          <MetricCard label="Ciudad actual" value={trip.currentCity} detail="Ubicación previa al viaje" icon={<MapPin size={21} />} tone="purple" />
          <MetricCard label="Duración" value={`${trip.itinerary.length} días`} detail={`${trip.bases.length} ciudades base`} icon={<Clock3 size={21} />} tone="teal" />
          <MetricCard label="Reservas" value={`${trip.reservations.length} registradas`} detail={trip.reservations.length ? "Consulta tus documentos" : "Añade la primera"} icon={<CalendarDays size={21} />} tone="red" />
          <MetricCard label={`${participant.name} · colección`} value={`${unlocked} de ${trip.achievements.length}`} detail="Progreso individual" icon={<Sparkles size={21} />} tone="yellow" />
        </div>
      </section>

      <div className="dashboard-grid lower-dashboard-grid">
        <article className="surface-card day-preview-card">
          <header className="card-header-row"><div><p className="eyebrow">Inicio del viaje · {featuredDay.weekday} {featuredDay.dayNumber}</p><h2>{featuredDay.area}</h2></div>{featuredDay.weather ? <span className="weather-pill">{featuredDay.weather}</span> : null}</header>
          <div className="mini-timeline">
            {featuredDay.activities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="mini-timeline-item"><time>{activity.startTime ?? "Flexible"}</time><span className="mini-activity-icon">{activityIcons[activity.category]}</span><div><strong>{activity.title}</strong><small><MapPin size={12} aria-hidden="true" /> {activity.location.name}</small></div></div>
            ))}
          </div>
          <button type="button" className="secondary-button full-width" onClick={() => onNavigate("itinerary")}>Abrir itinerario <ArrowRight size={16} aria-hidden="true" /></button>
        </article>

        <article className="surface-card bases-card">
          <header><p className="eyebrow">Tu ruta en Japón</p><h2>Tres bases, mil historias</h2></header>
          <div className="bases-list">
            {trip.bases.map((base, index) => (
              <div className="base-item" key={base.city}><span className="base-number">0{index + 1}</span><span className="base-emoji">{base.icon}</span><div><strong>{base.city}</strong><small>{base.nights} noches</small></div><Navigation size={16} aria-hidden="true" /></div>
            ))}
          </div>
          <button type="button" className="text-link" onClick={() => onNavigate("map")}>Explorar mapa <ArrowRight size={15} aria-hidden="true" /></button>
        </article>
      </div>
    </div>
  );
}
