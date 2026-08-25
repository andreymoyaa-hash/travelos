"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gem,
  GripVertical,
  Link2,
  MapPin,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";

import { FlightCard } from "@/components/cards/flight-card";
import { ActivityIcon } from "@/components/ui/activity-icon";
import { SectionHeading } from "@/components/ui/section-heading";
import { ItineraryEditorModal, type ItineraryEditorState } from "@/features/itinerary/itinerary-editor-modal";
import { MovePlanModal, type MovePlanState } from "@/features/itinerary/move-plan-modal";
import { formatMoney } from "@/lib/format";
import type {
  Activity,
  FlightSegment,
  Reservation,
  TripBase,
  TripDay,
} from "@/types/travel";

const dayTypeLabels: Record<TripDay["dayType"], string> = {
  standard: "Día estándar",
  travel: "Travel Day",
  "base-transition": "Base Transition Day",
  "theme-park": "Theme Park Full Day",
  "pokemon-full-day": "Pokémon Full Day",
  flexible: "Flexible Day",
  relaxed: "Relaxed Day",
  recovery: "Recovery Day",
};

interface ItineraryViewProps {
  itinerary: TripDay[];
  bases: TripBase[];
  flightSegments: FlightSegment[];
  reservations: Reservation[];
  onSaveActivity: (dayId: string, activity: Activity) => void;
  onDeleteActivity: (dayId: string, activityId: string) => void;
  onReorderActivity: (dayId: string, activityId: string, direction: -1 | 1) => void;
  onUpdateDay: (dayId: string, update: Partial<TripDay>) => void;
  onUpdateBase: (base: TripBase) => void;
  onMoveActivity: (sourceDayId: string, targetDayId: string, activityId: string, moveReservation: boolean) => void;
  onSwapDayPlans: (sourceDayId: string, targetDayId: string, moveReservations: boolean) => void;
}

export function ItineraryView({
  itinerary,
  bases,
  flightSegments,
  reservations,
  onSaveActivity,
  onDeleteActivity,
  onReorderActivity,
  onUpdateDay,
  onUpdateBase,
  onMoveActivity,
  onSwapDayPlans,
}: ItineraryViewProps) {
  const [selectedDayId, setSelectedDayId] = useState(itinerary[0].id);
  const [editor, setEditor] = useState<ItineraryEditorState>();
  const [move, setMove] = useState<MovePlanState>();
  const [deleteTarget, setDeleteTarget] = useState<Activity>();
  const selectedDay = itinerary.find((day) => day.id === selectedDayId) ?? itinerary[0];
  const selectedBase = bases.find((base) => base.id === selectedDay.baseId);
  const previousBase = bases.find((base) => base.id === selectedDay.previousBaseId);
  const dailyEstimate = selectedDay.activities.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0);
  const flightIds = new Set(selectedDay.activities.map((item) => item.flightSegmentId).filter(Boolean));
  const relatedFlights = flightSegments.filter((flight) => flightIds.has(flight.id));
  const linkedReservationCount = selectedDay.activities.filter((activity) => activity.reservationId).length;
  const hiddenGemCount = selectedDay.activities.filter((activity) => activity.hiddenGem).length;

  const selectAdjacentDay = (direction: -1 | 1) => {
    const currentIndex = itinerary.findIndex((day) => day.id === selectedDay.id);
    const nextIndex = Math.min(itinerary.length - 1, Math.max(0, currentIndex + direction));
    setSelectedDayId(itinerary[nextIndex].id);
  };

  return (
    <div className="view-stack">
      <SectionHeading
        eyebrow="Japón 2026 · plan maestro editable"
        title="Itinerario"
        description="22 días reales con bases, vuelos, lugares y referencias que puedes reorganizar sin editar código."
        action={<button type="button" className="primary-button" onClick={() => setEditor({ kind: "activity", dayId: selectedDay.id })}><CalendarPlus size={17} aria-hidden="true" /> Nueva actividad</button>}
      />

      <div className="date-strip day-card-strip" aria-label="Seleccionar día">
        {itinerary.map((day) => {
          const baseIndex = bases.findIndex((base) => base.id === day.baseId);
          const routeClass = day.dayType === "travel" ? "route-travel" : day.dayType === "base-transition" ? "route-transition" : `route-base-${Math.max(1, baseIndex + 1)}`;
          const dayReservationCount = day.activities.filter((activity) => activity.reservationId).length;
          const dayHiddenGemCount = day.activities.filter((activity) => activity.hiddenGem).length;
          return (
            <button type="button" key={day.id} className={`${day.id === selectedDay.id ? "date-chip active" : "date-chip"} ${routeClass}`} onClick={() => setSelectedDayId(day.id)}>
              <span className="date-chip-date"><small>{day.weekday}</small><strong>{day.dayNumber}</strong><span>{day.month}</span></span>
              <span className="date-chip-copy"><b>{day.area}</b><small>{bases[baseIndex]?.city ?? day.city}</small></span>
              <span className="date-chip-meta"><small>{day.activities.length} actividades</small><small>{dayHiddenGemCount ? `${dayHiddenGemCount} hidden gem${dayHiddenGemCount > 1 ? "s" : ""}` : "Sin hidden gems"}</small><small>{dayReservationCount ? `${dayReservationCount} reservas` : "Sin reservas"}</small></span>
              <i className="date-chip-marker" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="itinerary-layout">
        <section className="surface-card itinerary-main-card">
          <header className="itinerary-day-header">
            <button type="button" className="icon-button" onClick={() => selectAdjacentDay(-1)} disabled={selectedDay.id === itinerary[0].id} aria-label="Día anterior"><ChevronLeft size={20} aria-hidden="true" /></button>
            <div><p className="eyebrow">{selectedDay.date} · {selectedDay.city}</p><h2>{selectedDay.area}</h2><span>{dayTypeLabels[selectedDay.dayType]}</span></div>
            <button type="button" className="icon-button" onClick={() => selectAdjacentDay(1)} disabled={selectedDay.id === itinerary.at(-1)?.id} aria-label="Día siguiente"><ChevronRight size={20} aria-hidden="true" /></button>
          </header>

          <div className="day-detail-ribbon">
            <span><small>Fecha</small><strong>{selectedDay.weekday} {selectedDay.dayNumber} NOV</strong></span>
            <span><small>Base</small><strong>{previousBase ? `${previousBase.city} → ` : ""}{selectedBase?.city ?? "Travel / Flight"}</strong></span>
            <span><small>Ciudad visitada</small><strong>{selectedDay.visitedCity ?? selectedDay.city}</strong></span>
            <div><button type="button" className="secondary-button" onClick={() => setEditor({ kind: "day", dayId: selectedDay.id })}><Pencil size={14} /> Editar día</button><button type="button" className="secondary-button" onClick={() => setMove({ kind: "day", dayId: selectedDay.id })}><ArrowRightLeft size={14} /> Mover plan</button></div>
          </div>

          {selectedDay.notes ? <div className="day-master-note"><NotebookPen size={15} /><p>{selectedDay.notes}</p></div> : null}

          <div className="timeline-list">
            {selectedDay.activities.map((activity, index) => {
              const linkedReservation = reservations.find((reservation) => reservation.id === activity.reservationId);
              return (
                <article key={activity.id} className="timeline-activity">
                  <div className="timeline-time"><strong>{activity.startTime ?? "Flexible"}</strong>{index < selectedDay.activities.length - 1 ? <span /> : null}</div>
                  <ActivityIcon category={activity.category} className={`activity-marker marker-${activity.category}`} />
                  <div className="activity-card activity-card-editable">
                    <div className="activity-main-copy">
                      <div className="activity-title-row"><h3>{activity.title}</h3><div className="activity-flags">{activity.optional ? <span>Opcional</span> : null}{activity.hiddenGem ? <span className="hidden-gem-flag">Hidden gem</span> : null}</div></div>
                      <p><MapPin size={14} aria-hidden="true" /> {activity.location.name}{activity.city ? ` · ${activity.city}` : ""}</p>
                      <div className="activity-category-tags">{activity.categories.map((category) => <span key={category}>{category.replace("theme-park", "theme park")}</span>)}</div>
                    </div>
                    {activity.estimatedCost !== undefined && activity.currency ? <span className="activity-cost">{formatMoney(activity.estimatedCost, activity.currency)}</span> : null}
                    {activity.notes ? <div className="activity-note"><NotebookPen size={14} aria-hidden="true" /> {activity.notes}</div> : null}
                    {linkedReservation ? <div className="activity-reservation"><Link2 size={13} /><span><strong>{linkedReservation.title}</strong> · {linkedReservation.status === "confirmed" ? "Confirmada" : "Pendiente"}</span></div> : null}
                    {activity.stampId ? <small className="stamp-reference">Travel Passport · {activity.stampId}</small> : null}
                    <div className="activity-actions" aria-label={`Acciones para ${activity.title}`}>
                      <span className="activity-grip" title="Orden de la actividad"><GripVertical size={17} aria-hidden="true" /></span>
                      <button type="button" className="icon-button" disabled={index === 0} onClick={() => onReorderActivity(selectedDay.id, activity.id, -1)} aria-label={`Subir ${activity.title}`}><ArrowUp size={14} /></button>
                      <button type="button" className="icon-button" disabled={index === selectedDay.activities.length - 1} onClick={() => onReorderActivity(selectedDay.id, activity.id, 1)} aria-label={`Bajar ${activity.title}`}><ArrowDown size={14} /></button>
                      <button type="button" className="icon-button" onClick={() => setEditor({ kind: "activity", dayId: selectedDay.id, activity })} aria-label={`Editar ${activity.title}`}><Pencil size={14} /></button>
                      <button type="button" className="icon-button" onClick={() => setMove({ kind: "activity", dayId: selectedDay.id, activityId: activity.id })} aria-label={`Mover ${activity.title}`}><ArrowRightLeft size={14} /></button>
                      <button type="button" className="icon-button danger" onClick={() => setDeleteTarget(activity)} aria-label={`Eliminar ${activity.title}`}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
            {selectedDay.activities.length === 0 ? <div className="empty-state compact"><span>＋</span><h2>Este día está abierto</h2><p>Añade un lugar o mueve aquí una actividad existente.</p></div> : null}
          </div>
          <button type="button" className="secondary-button full-width add-place-button" onClick={() => setEditor({ kind: "activity", dayId: selectedDay.id })}><Plus size={16} /> Agregar actividad o lugar</button>
        </section>

        <aside className="itinerary-side-stack">
          <article className="surface-card day-stats-card">
            <p className="eyebrow">Resumen del día</p>
            <div><Clock3 size={18} aria-hidden="true" /><span><strong>{selectedDay.activities.length}</strong> actividades</span></div>
            <div><WalletCards size={18} aria-hidden="true" /><span><strong>{dailyEstimate ? formatMoney(dailyEstimate, "JPY") : "Sin costos"}</strong> registrados</span></div>
            <div><MapPin size={18} aria-hidden="true" /><span><strong>{selectedBase?.city ?? selectedDay.city}</strong> base logística</span></div>
            <div><Link2 size={18} aria-hidden="true" /><span><strong>{linkedReservationCount}</strong> reservas vinculadas</span></div>
            <div><Gem size={18} aria-hidden="true" /><span><strong>{hiddenGemCount}</strong> hidden gems</span></div>
          </article>

          {selectedBase ? (
            <article className="surface-card accommodation-card">
              <header><div><p className="eyebrow">Alojamiento</p><h3>{selectedBase.city}</h3></div><span className={selectedBase.status === "confirmed" ? "base-status confirmed" : "base-status"}>{selectedBase.status === "confirmed" ? "Confirmado" : "Pendiente de agregar"}</span></header>
              <p>{selectedBase.area ?? "Zona pendiente de agregar"}</p>
              <small>{selectedBase.checkInDate} → {selectedBase.checkOutDate} · {selectedBase.nights} noches</small>
              {selectedBase.location.address ? <address>{selectedBase.location.address}</address> : null}
              <button type="button" className="secondary-button full-width" onClick={() => setEditor({ kind: "base", baseId: selectedBase.id })}><Pencil size={14} /> Editar alojamiento</button>
            </article>
          ) : null}

          {relatedFlights.map((flight) => <FlightCard flight={flight} compact key={flight.id} />)}

          <article className="travel-tip-card">
            <span>知</span><p className="eyebrow">{selectedDay.hiddenGem ? "Hidden gem" : "Plan flexible"}</p><h3>{selectedDay.area}</h3><p>{selectedDay.hiddenGem ?? "Los horarios, notas, costos, lugares y reservas pueden modificarse desde este día."}</p>
          </article>
        </aside>
      </div>

      {editor ? <ItineraryEditorModal key={`${editor.kind}-${editor.kind === "base" ? editor.baseId : editor.dayId}-${editor.kind === "activity" ? editor.activity?.id ?? "new" : ""}`} editor={editor} itinerary={itinerary} bases={bases} reservations={reservations} onClose={() => setEditor(undefined)} onSaveActivity={onSaveActivity} onSaveDay={onUpdateDay} onSaveBase={onUpdateBase} /> : null}
      {move ? <MovePlanModal move={move} itinerary={itinerary} reservations={reservations} onClose={() => setMove(undefined)} onMoveActivity={onMoveActivity} onSwapDayPlans={onSwapDayPlans} /> : null}
      {deleteTarget ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDeleteTarget(undefined)}>
          <section className="expense-modal confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-activity-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><p className="eyebrow">Confirmar cambio</p><h2 id="delete-activity-title">Eliminar actividad</h2></div><span className="danger-icon"><Trash2 size={21} aria-hidden="true" /></span></header>
            <p>“{deleteTarget.title}” se eliminará del {selectedDay.weekday} {selectedDay.dayNumber} NOV. Sus reservas independientes no se borrarán.</p>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setDeleteTarget(undefined)}>Cancelar</button><button type="button" className="danger-button" onClick={() => { onDeleteActivity(selectedDay.id, deleteTarget.id); setDeleteTarget(undefined); }}>Eliminar actividad</button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
