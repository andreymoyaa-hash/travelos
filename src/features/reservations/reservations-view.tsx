"use client";

import { type FormEvent, useState } from "react";
import { BedDouble, CalendarPlus, Check, ChevronRight, Plane, QrCode, Ticket, TrainFront, X } from "lucide-react";

import { SectionHeading } from "@/components/ui/section-heading";
import type { Reservation, ReservationType } from "@/types/travel";

const filters: Array<{ id: "all" | ReservationType; label: string }> = [
  { id: "all", label: "Todo" },
  { id: "flight", label: "Vuelos" },
  { id: "hotel", label: "Hoteles" },
  { id: "train", label: "Trenes" },
  { id: "ticket", label: "Entradas" },
];

const reservationIcons = {
  flight: Plane,
  hotel: BedDouble,
  train: TrainFront,
  ticket: Ticket,
  restaurant: Ticket,
};

interface ReservationsViewProps {
  reservations: Reservation[];
  onAddReservation: (reservation: Reservation) => void;
}

const accentByType: Record<ReservationType, string> = {
  flight: "#df5551",
  hotel: "#bc8741",
  train: "#4c82a4",
  ticket: "#7357ad",
  restaurant: "#3f8a70",
};

export function ReservationsView({ reservations, onAddReservation }: ReservationsViewProps) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [formOpen, setFormOpen] = useState(false);
  const visibleReservations = filter === "all"
    ? reservations
    : reservations.filter((reservation) => reservation.type === filter);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = form.get("type") as ReservationType;

    onAddReservation({
      id: `reservation-${Date.now()}`,
      type,
      provider: String(form.get("provider") || "Proveedor"),
      code: String(form.get("code") || "PENDIENTE"),
      title: String(form.get("title") || "Nueva reserva"),
      subtitle: String(form.get("subtitle") || "2 viajeros"),
      date: String(form.get("date") || "13 NOV").toUpperCase(),
      time: String(form.get("time") || "09:00"),
      status: "confirmed",
      accent: accentByType[type],
      meta: "Añadida desde Travel OS",
    });
    setFilter("all");
    setFormOpen(false);
  };

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow="Todo listo para despegar"
        title="Reservas"
        description="Vuelos, noches y entradas; accesibles incluso cuando el wifi no acompaña."
        action={<button type="button" className="primary-button" onClick={() => setFormOpen(true)}><CalendarPlus size={17} /> Añadir reserva</button>}
      />

      <div className="filter-tabs" role="tablist" aria-label="Filtrar reservas">
        {filters.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={filter === item.id ? "active" : ""}
            key={item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="reservation-grid" aria-live="polite">
        {visibleReservations.map((reservation) => (
          <ReservationCard reservation={reservation} key={reservation.id} />
        ))}
        {visibleReservations.length === 0 ? (
          <div className="empty-state">
            <span>旅</span><h2>No tienes reservas registradas</h2><p>Cuando añadas una, aparecerá en este espacio.</p>
          </div>
        ) : null}
      </section>

      <article className="offline-banner">
        <div className="offline-mark"><QrCode size={24} aria-hidden="true" /></div>
        <div><p className="eyebrow">Modo sin conexión</p><h3>Tus documentos viajarán contigo</h3><p>El almacenamiento durable y los QR sin internet están preparados para una integración posterior.</p></div>
        <span><Check size={15} /> Planificado</span>
      </article>

      {formOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setFormOpen(false)}>
          <section className="expense-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-form-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><p className="eyebrow">Todo en un lugar</p><h2 id="reservation-form-title">Nueva reserva</h2></div>
              <button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setFormOpen(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>Tipo<select name="type" defaultValue="flight"><option value="flight">✈️ Vuelo</option><option value="hotel">🏨 Hotel</option><option value="train">🚄 Tren</option><option value="ticket">🎟️ Entrada</option><option value="restaurant">🍽️ Restaurante</option></select></label>
                <label>Proveedor<input name="provider" placeholder="Ej. JR Central" required /></label>
              </div>
              <label>Nombre de la reserva<input name="title" placeholder="Ej. Kyoto → Shin-Osaka" required autoFocus /></label>
              <label>Detalle<input name="subtitle" placeholder="2 viajeros · asiento reservado" /></label>
              <div className="form-grid">
                <label>Código<input name="code" placeholder="ABC-123" required /></label>
                <label>Fecha<input name="date" placeholder="15 NOV" required /></label>
              </div>
              <label>Hora<input name="time" type="time" defaultValue="09:00" required /></label>
              <button type="submit" className="primary-button full-width">Guardar reserva</button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const Icon = reservationIcons[reservation.type];
  return (
    <article className="reservation-card" style={{ "--reservation-accent": reservation.accent } as React.CSSProperties}>
      <div className="reservation-ribbon"><Icon size={20} aria-hidden="true" /><span>{reservation.provider}</span><small>{reservation.status === "confirmed" ? "Confirmado" : "Pendiente"}</small></div>
      <div className="reservation-content">
        <div className="reservation-date"><strong>{reservation.date.split(" ")[0]}</strong><span>{reservation.date.split(" ")[1]}</span></div>
        <div className="reservation-detail"><small>{reservation.code}</small><h2>{reservation.title}</h2><p>{reservation.subtitle}</p><span>{reservation.time} · {reservation.meta}</span></div>
        <button type="button" className="icon-button" aria-label={`Abrir ${reservation.title}`}><ChevronRight size={19} /></button>
      </div>
      <div className="ticket-tear" aria-hidden="true"><span /><i /></div>
      <footer><QrCode size={28} aria-hidden="true" /><span>Documento guardado</span><button type="button">Ver detalle</button></footer>
    </article>
  );
}
