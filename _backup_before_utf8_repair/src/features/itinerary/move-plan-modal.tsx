"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight, ArrowRightLeft, CalendarDays, Link2, X } from "lucide-react";

import type { Reservation, TripDay } from "@/types/travel";

export type MovePlanState =
  | { kind: "day"; dayId: string }
  | { kind: "activity"; dayId: string; activityId: string };

interface MovePlanModalProps {
  move: MovePlanState;
  itinerary: TripDay[];
  reservations: Reservation[];
  onClose: () => void;
  onMoveActivity: (sourceDayId: string, targetDayId: string, activityId: string, moveReservation: boolean) => void;
  onSwapDayPlans: (sourceDayId: string, targetDayId: string, moveReservations: boolean) => void;
}

export function MovePlanModal({ move, itinerary, reservations, onClose, onMoveActivity, onSwapDayPlans }: MovePlanModalProps) {
  const sourceDay = itinerary.find((day) => day.id === move.dayId);
  const activity = move.kind === "activity"
    ? sourceDay?.activities.find((item) => item.id === move.activityId)
    : undefined;
  const linkedReservationIds = move.kind === "activity"
    ? [activity?.reservationId].filter((id): id is string => Boolean(id))
    : sourceDay?.activities.map((item) => item.reservationId).filter((id): id is string => Boolean(id)) ?? [];
  const linkedReservations = reservations.filter((reservation) => linkedReservationIds.includes(reservation.id));
  const [moveReservations, setMoveReservations] = useState(linkedReservations.length > 0);
  const [targetDayId, setTargetDayId] = useState("");
  const targetDay = itinerary.find((day) => day.id === targetDayId);

  if (!sourceDay) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetDayId) return;

    if (move.kind === "activity") {
      onMoveActivity(sourceDay.id, targetDayId, move.activityId, moveReservations);
    } else {
      onSwapDayPlans(sourceDay.id, targetDayId, moveReservations);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="expense-modal move-plan-modal" role="dialog" aria-modal="true" aria-labelledby="move-plan-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><p className="eyebrow">Plan flexible</p><h2 id="move-plan-title">{move.kind === "day" ? "Mover plan" : "Mover actividad"}</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={20} /></button></header>
        <div className="move-plan-summary"><ArrowRightLeft size={20} /><div><small>{move.kind === "day" ? "Plan completo" : "Actividad"}</small><strong>{activity?.title ?? sourceDay.area}</strong><p>Se conservarán ubicación, notas, costo, stamp y referencias.</p></div></div>
        <form onSubmit={handleSubmit}>
          <div className="move-date-comparison">
            <span><CalendarDays size={17} aria-hidden="true" /><small>Fecha actual</small><strong>{sourceDay.dayNumber} {sourceDay.month}</strong><em>{sourceDay.area}</em></span>
            <ArrowRight size={19} aria-hidden="true" />
            <span className={targetDay ? "selected" : ""}><CalendarDays size={17} aria-hidden="true" /><small>Nueva fecha</small><strong>{targetDay ? `${targetDay.dayNumber} ${targetDay.month}` : "Por elegir"}</strong><em>{targetDay?.area ?? "Selecciona un día"}</em></span>
          </div>
          <label>{move.kind === "day" ? "Intercambiar plan con" : "Mover a"}<select name="targetDayId" value={targetDayId} onChange={(event) => setTargetDayId(event.target.value)} required><option value="" disabled>Selecciona otro día</option>{itinerary.filter((day) => day.id !== sourceDay.id).map((day) => <option value={day.id} key={day.id}>{day.weekday} {day.dayNumber} · {day.area}</option>)}</select></label>
          {linkedReservations.length > 0 ? (
            <div className="reservation-move-warning">
              <strong><Link2 size={16} aria-hidden="true" /> Este día contiene reservas vinculadas.</strong>
              <p>{linkedReservations.map((reservation) => reservation.title).join(", ")}</p>
              <label className="radio-label"><input type="radio" name="reservationMode" checked={moveReservations} onChange={() => setMoveReservations(true)} /> Mover actividades y reservas</label>
              <label className="radio-label"><input type="radio" name="reservationMode" checked={!moveReservations} onChange={() => setMoveReservations(false)} /> Mover solo actividades</label>
            </div>
          ) : <p className="data-note">No hay reservas vinculadas a este plan.</p>}
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button">{move.kind === "day" ? "Intercambiar plan" : "Mover actividad"}</button></div>
        </form>
      </section>
    </div>
  );
}
