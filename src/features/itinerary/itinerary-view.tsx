"use client";

import { type FormEvent, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock3, MapPin, NotebookPen, WalletCards, X } from "lucide-react";

import { SectionHeading } from "@/components/ui/section-heading";
import { formatYen } from "@/lib/format";
import type { Activity, ItineraryDay } from "@/types/travel";

const categoryIcon: Record<Activity["category"], string> = {
  culture: "⛩️",
  food: "🍜",
  transport: "🚄",
  shopping: "🛍️",
  leisure: "✨",
};

interface ItineraryViewProps {
  itinerary: ItineraryDay[];
  onAddActivity: (dayId: string, activity: Activity) => void;
}

export function ItineraryView({ itinerary, onAddActivity }: ItineraryViewProps) {
  const [selectedDayId, setSelectedDayId] = useState(itinerary[0].id);
  const [formOpen, setFormOpen] = useState(false);
  const selectedDay = itinerary.find((day) => day.id === selectedDayId) ?? itinerary[0];
  const dailyEstimate = selectedDay.activities.reduce((sum, activity) => sum + activity.estimatedCost, 0);

  const selectAdjacentDay = (direction: -1 | 1) => {
    const currentIndex = itinerary.findIndex((day) => day.id === selectedDay.id);
    const nextIndex = Math.min(itinerary.length - 1, Math.max(0, currentIndex + direction));
    setSelectedDayId(itinerary[nextIndex].id);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const dayId = String(form.get("dayId") || selectedDay.id);
    const estimatedCost = Number(form.get("estimatedCost"));
    const note = String(form.get("note") || "").trim();

    onAddActivity(dayId, {
      id: `activity-${Date.now()}`,
      time: String(form.get("time") || "09:00"),
      title: String(form.get("title") || "Nueva actividad"),
      location: String(form.get("location") || "Por definir"),
      category: form.get("category") as Activity["category"],
      estimatedCost: Number.isFinite(estimatedCost) ? estimatedCost : 0,
      note: note || undefined,
    });
    setSelectedDayId(dayId);
    setFormOpen(false);
  };

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow="Tu plan, minuto a minuto"
        title="Itinerario"
        description="Cada día tiene espacio para cambiar. La aventura no tiene que sentirse apretada."
        action={
          <button type="button" className="primary-button" onClick={() => setFormOpen(true)}>
            <CalendarPlus size={17} aria-hidden="true" /> Nueva actividad
          </button>
        }
      />

      <div className="date-strip" aria-label="Seleccionar día">
        {itinerary.map((day) => (
          <button
            type="button"
            key={day.id}
            className={day.id === selectedDay.id ? "date-chip active" : "date-chip"}
            onClick={() => setSelectedDayId(day.id)}
          >
            <small>{day.weekday}</small>
            <strong>{day.dayNumber}</strong>
            <span>{day.month}</span>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="itinerary-layout">
        <section className="surface-card itinerary-main-card">
          <header className="itinerary-day-header">
            <button
              type="button"
              className="icon-button"
              onClick={() => selectAdjacentDay(-1)}
              disabled={selectedDay.id === itinerary[0].id}
              aria-label="Día anterior"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <div>
              <p className="eyebrow">{selectedDay.city}</p>
              <h2>{selectedDay.area}</h2>
              {selectedDay.weather ? <span>{selectedDay.weather}</span> : null}
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => selectAdjacentDay(1)}
              disabled={selectedDay.id === itinerary.at(-1)?.id}
              aria-label="Día siguiente"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="timeline-list">
            {selectedDay.activities.map((activity, index) => (
              <article key={activity.id} className="timeline-activity">
                <div className="timeline-time">
                  <strong>{activity.time}</strong>
                  {index < selectedDay.activities.length - 1 ? <span /> : null}
                </div>
                <div className={`activity-marker marker-${activity.category}`}>
                  {categoryIcon[activity.category]}
                </div>
                <div className="activity-card">
                  <div>
                    <h3>{activity.title}</h3>
                    <p><MapPin size={14} aria-hidden="true" /> {activity.location}</p>
                  </div>
                  <span className="activity-cost">
                    {activity.estimatedCost === 0 ? "Gratis" : formatYen(activity.estimatedCost)}
                  </span>
                  {activity.note ? (
                    <div className="activity-note"><NotebookPen size={14} aria-hidden="true" /> {activity.note}</div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="itinerary-side-stack">
          <article className="surface-card day-stats-card">
            <p className="eyebrow">Resumen del día</p>
            <div><Clock3 size={18} aria-hidden="true" /><span><strong>{selectedDay.activities.length}</strong> actividades</span></div>
            <div><WalletCards size={18} aria-hidden="true" /><span><strong>{formatYen(dailyEstimate)}</strong> estimados</span></div>
            <div><MapPin size={18} aria-hidden="true" /><span><strong>{selectedDay.city}</strong> ciudad base</span></div>
          </article>
          <article className="travel-tip-card">
            <span>知</span>
            <p className="eyebrow">Plan flexible</p>
            <h3>{selectedDay.area}</h3>
            <p>Los horarios sin confirmar aparecen como “Por definir”. Completa los datos reales cuando tengas las reservas.</p>
          </article>
        </aside>
      </div>

      {formOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setFormOpen(false)}>
          <section className="expense-modal" role="dialog" aria-modal="true" aria-labelledby="activity-form-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><p className="eyebrow">Un momento más</p><h2 id="activity-form-title">Nueva actividad</h2></div>
              <button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setFormOpen(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleSubmit}>
              <label>Día<select name="dayId" defaultValue={selectedDay.id}>{itinerary.map((day) => <option value={day.id} key={day.id}>{day.weekday} {day.dayNumber} · {day.area}</option>)}</select></label>
              <label>Actividad<input name="title" placeholder="Ej. Nintendo Museum" required autoFocus /></label>
              <div className="form-grid">
                <label>Hora<input name="time" type="time" defaultValue="09:00" required /></label>
                <label>Categoría<select name="category" defaultValue="culture"><option value="culture">⛩️ Cultura</option><option value="food">🍜 Comida</option><option value="transport">🚄 Transporte</option><option value="shopping">🛍️ Compras</option><option value="leisure">✨ Ocio</option></select></label>
              </div>
              <label>Ubicación<input name="location" placeholder="Barrio, estación o dirección" required /></label>
              <div className="form-grid">
                <label>Presupuesto estimado<input name="estimatedCost" type="number" min="0" defaultValue="0" /></label>
                <label>Nota<input name="note" placeholder="Opcional" /></label>
              </div>
              <button type="submit" className="primary-button full-width">Añadir al itinerario</button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
