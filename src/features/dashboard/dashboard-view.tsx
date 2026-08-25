import { ArrowRight, CalendarDays, Camera, CircleDollarSign, Clock3, Globe2, Hotel, MapPin, Navigation, Plane, Sparkles } from "lucide-react";

import { MetricCard } from "@/components/cards/metric-card";
import { FlightCard } from "@/components/cards/flight-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ActivityIcon } from "@/components/ui/activity-icon";
import { WorldClock } from "@/components/world-clock";
import { formatMoney } from "@/lib/format";
import type { CountryTheme, FeatureId, Participant, Trip } from "@/types/travel";

interface DashboardViewProps {
  trip: Trip;
  theme: CountryTheme;
  participant: Participant;
  spent: number;
  onNavigate: (feature: FeatureId) => void;
  onOpenCamera: () => void;
}

export function DashboardView({ trip, theme, participant, spent, onNavigate, onOpenCamera }: DashboardViewProps) {
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
          <h1>{theme.labels.greeting}, {participant.name} <span aria-hidden="true">👋</span></h1>
          <p>Tu aventura toma forma. Esto es lo que sigue.</p>
        </div>
        <div className="heading-actions"><button type="button" className="quiet-button" onClick={onOpenCamera}><Camera size={16} /> Tomar foto</button><button type="button" className="quiet-button" onClick={() => onNavigate("itinerary")}>Ver plan completo <ArrowRight size={16} aria-hidden="true" /></button></div>
      </header>

      <section className="trip-hero" aria-labelledby="trip-hero-title">
        <div className={`hero-pattern ${theme.decorativeStyle}`} aria-hidden="true"><span className="sun-disc" /><span className="mountain mountain-one" /><span className="mountain mountain-two" />{theme.decorativeStyle === "japan" ? <span className="torii-gate"><i /><b /></span> : <span className="destination-geometry">{theme.landmark}</span>}</div>
        <div className="trip-hero-content">
          <div className="hero-kicker"><span>{theme.flag}</span> Tu próxima aventura</div>
          <h2 id="trip-hero-title">{trip.name}</h2>
          <p>{trip.dateRange} · {trip.participants.length} participantes</p>
          <div className="route-line" aria-label={`Ruta: ${trip.route.join(", ")}`}>
            {trip.route.map((place, index) => (
              <div key={`${place}-${index}`} className="route-stop"><span className={index === trip.route.length - 1 ? "route-dot destination" : "route-dot"} /><small>{place}</small>{index < trip.route.length - 1 ? <i /> : null}</div>
            ))}
          </div>
        </div>
        <div className="countdown-block"><span>Faltan</span><strong>{trip.countdownDays}</strong><small>días</small><div className="countdown-plane"><Plane size={22} aria-hidden="true" /></div></div>
      </section>

      <WorldClock config={trip.worldClock} startDate={trip.startDate} endDate={trip.endDate} />

      {trip.flightSegments.length ? <section className="flight-section" aria-labelledby="outbound-flights-title">
        <div className="subsection-heading"><div><p className="eyebrow">Ruta aérea confirmada</p><h2 id="outbound-flights-title">{trip.countryId === "japan" ? "Costa Rica → México → Japón" : trip.route.join(" → ")}</h2></div><span className="transport-chip"><Plane size={16} aria-hidden="true" /> {trip.flightSegments[0]?.airline}</span></div>
        {trip.countryId === "japan" ? <div className="international-date-line" aria-label="Cambio internacional de fecha">
          <span><strong>09 NOV</strong><small>Salida Costa Rica</small></span>
          <i />
          <span><strong>10 NOV</strong><small>En vuelo</small></span>
          <span className="date-change-note"><Globe2 size={17} aria-hidden="true" /> Cruce de zona horaria / cambio internacional de fecha</span>
          <i />
          <span><strong>11 NOV</strong><small>Llegada Japón</small></span>
        </div> : null}
        <div className="flight-card-grid">{trip.flightSegments.map((flight) => <FlightCard flight={flight} key={flight.id} />)}</div>
      </section> : null}

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
          {featuredDay ? <><header className="card-header-row"><div><p className="eyebrow">Inicio del viaje · {featuredDay.weekday} {featuredDay.dayNumber}</p><h2>{featuredDay.area}</h2></div>{featuredDay.weather ? <span className="weather-pill">{featuredDay.weather}</span> : null}</header>
          <div className="mini-timeline">
            {featuredDay.activities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="mini-timeline-item"><time>{activity.startTime ?? "Flexible"}</time><ActivityIcon category={activity.category} size={17} className="mini-activity-icon" /><div><strong>{activity.title}</strong><small><MapPin size={12} aria-hidden="true" /> {activity.location.name}</small></div></div>
            ))}
          </div></> : <div className="dashboard-empty"><CalendarDays size={28} /><div><strong>Itinerario vacío</strong><p>Añade el primer día y después crea actividades independientes para este viaje.</p></div></div>}
          <button type="button" className="secondary-button full-width" onClick={() => onNavigate("itinerary")}>Abrir itinerario <ArrowRight size={16} aria-hidden="true" /></button>
        </article>

        <article className="surface-card bases-card">
          <header><p className="eyebrow">{theme.labels.route}</p><h2>{trip.bases.length ? `${trip.bases.length} bases, muchas historias` : "Alojamientos por organizar"}</h2></header>
          <div className="bases-list">
            {trip.bases.map((base, index) => (
              <div className={`base-item route-base-${index + 1}`} key={base.city}>
                <span className="base-number">0{index + 1}</span><span className="base-emoji"><Hotel size={19} aria-hidden="true" /></span>
                <div><strong>{base.city}</strong><small>{base.checkInDate} → {base.checkOutDate} · {base.nights} noches</small><em>{base.area ?? "Alojamiento pendiente de agregar"}</em></div>
                <span className={base.status === "confirmed" ? "base-route-status confirmed" : "base-route-status"}>{base.status === "confirmed" ? "Confirmado" : "Pendiente"}</span>
                <Navigation size={16} aria-hidden="true" />
              </div>
            ))}
          </div>
          {!trip.bases.length ? <p className="data-note">No se copiarán alojamientos de otros viajes. Agrégalos cuando tengas información real.</p> : null}
          <button type="button" className="text-link" onClick={() => onNavigate("map")}>Explorar mapa <ArrowRight size={15} aria-hidden="true" /></button>
        </article>
      </div>
    </div>
  );
}
