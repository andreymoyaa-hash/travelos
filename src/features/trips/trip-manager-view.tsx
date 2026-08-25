"use client";

import { type FormEvent, useState } from "react";
import { CalendarDays, Cloud, Edit3, MapPin, Plus, ShieldCheck, Trash2, Users, X } from "lucide-react";

import { countryThemeById } from "@/data/countries";
import type { CreateTripInput } from "@/repositories/trip-repository";
import type { CountryId, Currency, Trip } from "@/types/travel";

interface TripManagerViewProps {
  trips: Trip[];
  activeTripId: string;
  onOpenTrip: (id: string) => void;
  onCreateTrip: (input: CreateTripInput) => void;
  onUpdateTrip: (trip: Trip, participantNames: string[]) => void;
  onDeleteTrip: (id: string) => void;
}

type ModalState = { kind: "create" } | { kind: "edit"; trip: Trip } | { kind: "delete"; trip: Trip } | { kind: "sharing"; trip: Trip };
const selectableCountries: CountryId[] = ["japan", "mexico", "other"];
const currencies: Currency[] = ["JPY", "MXN", "USD", "CRC", "EUR"];

export function TripManagerView({ trips, activeTripId, onOpenTrip, onCreateTrip, onUpdateTrip, onDeleteTrip }: TripManagerViewProps) {
  const [modal, setModal] = useState<ModalState>();
  const [deleteText, setDeleteText] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const participantNames = String(form.get("participants") || "").split(",").map((name) => name.trim()).filter(Boolean);
    if (modal?.kind === "edit") {
      const countryId = form.get("countryId") as CountryId;
      const startDate = String(form.get("startDate"));
      const endDate = String(form.get("endDate"));
      onUpdateTrip({
        ...modal.trip,
        name: String(form.get("name")).trim(),
        countryId,
        startDate,
        endDate,
        currentCity: String(form.get("initialCity") || "").trim() || countryThemeById[countryId].name,
        budget: { ...modal.trip.budget, currency: form.get("currency") as Currency },
        timezones: { ...modal.trip.timezones, destination: String(form.get("destinationTimeZone")) },
        worldClock: {
          ...modal.trip.worldClock,
          destination: {
            city: String(form.get("initialCity") || "").trim() || countryThemeById[countryId].name,
            countryCode: countryThemeById[countryId].countryCode,
            timeZone: String(form.get("destinationTimeZone")),
          },
        },
        settings: modal.trip.settings ? {
          ...modal.trip.settings,
          creatorName: String(form.get("creatorName")).trim(),
          initialCity: String(form.get("initialCity") || "").trim() || undefined,
          destinationTimeZone: String(form.get("destinationTimeZone")),
        } : modal.trip.settings,
      }, participantNames);
    } else {
      onCreateTrip({
        name: String(form.get("name")).trim(),
        countryId: form.get("countryId") as CountryId,
        initialCity: String(form.get("initialCity") || "").trim() || undefined,
        startDate: String(form.get("startDate")),
        endDate: String(form.get("endDate")),
        currency: form.get("currency") as Currency,
        destinationTimeZone: String(form.get("destinationTimeZone")),
        participantNames,
        creatorName: String(form.get("creatorName")).trim(),
      });
    }
    setModal(undefined);
  };

  return (
    <div className="view-stack trips-view">
      <header className="trips-heading">
        <div><p className="eyebrow">Travel OS · Local Mode</p><h1>Mis viajes</h1><p>Cada viaje tiene su propio itinerario, presupuesto, pasaporte, fotos y companion.</p></div>
        <button type="button" className="primary-button" onClick={() => setModal({ kind: "create" })}><Plus size={18} /> Crear viaje</button>
      </header>

      <div className="mode-banner"><ShieldCheck size={19} /><div><strong>Datos guardados en este dispositivo</strong><p>La edición local funciona sin backend. Cloud Sync se habilitará cuando Supabase esté configurado.</p></div></div>

      <section className="trip-manager-grid" aria-label="Viajes disponibles">
        {trips.map((trip) => {
          const theme = countryThemeById[trip.countryId] ?? countryThemeById.other;
          return (
            <article className={trip.id === activeTripId ? "trip-manager-card active" : "trip-manager-card"} key={trip.id} style={{ "--trip-card-accent": theme.colors.accent } as React.CSSProperties}>
              <div className={`trip-card-pattern ${theme.decorativeStyle}`} aria-hidden="true"><span>{theme.landmark}</span></div>
              <header><span className="trip-card-flag">{theme.flag}</span><span className="storage-pill">Local</span></header>
              <h2>{trip.name}</h2><p>{trip.dateRange}</p>
              <div className="trip-card-facts"><span><MapPin size={15} /> {trip.settings?.initialCity ?? trip.currentCity}</span><span><CalendarDays size={15} /> {trip.itinerary.length} días planificados</span><span><Users size={15} /> {trip.participants.length} participantes</span></div>
              <footer>
                <button type="button" className="primary-button" onClick={() => onOpenTrip(trip.id)}>{trip.id === activeTripId ? "Continuar viaje" : "Abrir viaje"}</button>
                <button type="button" className="icon-button" aria-label={`Editar ${trip.name}`} onClick={() => setModal({ kind: "edit", trip })}><Edit3 size={17} /></button>
                <button type="button" className="icon-button" aria-label={`Compartir ${trip.name}`} onClick={() => setModal({ kind: "sharing", trip })}><Cloud size={17} /></button>
                <button type="button" className="icon-button danger" disabled={trip.id === "japan-2026"} aria-label={trip.id === "japan-2026" ? "Japón 2026 está protegido" : `Eliminar ${trip.name}`} onClick={() => { setDeleteText(""); setModal({ kind: "delete", trip }); }}><Trash2 size={17} /></button>
              </footer>
              {trip.id === "japan-2026" ? <small className="protected-note">Viaje real protegido</small> : null}
            </article>
          );
        })}
      </section>

      {modal?.kind === "create" || modal?.kind === "edit" ? (
        <TripForm key={modal.kind === "edit" ? modal.trip.id : "create"} trip={modal.kind === "edit" ? modal.trip : undefined} onClose={() => setModal(undefined)} onSubmit={handleSubmit} />
      ) : null}

      {modal?.kind === "sharing" ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(undefined)}><section className="expense-modal cloud-modal" role="dialog" aria-modal="true" aria-labelledby="cloud-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Cloud Mode</p><h2 id="cloud-title">Invitar participante</h2></div><button type="button" className="icon-button" onClick={() => setModal(undefined)} aria-label="Cerrar"><X size={20} /></button></header><div className="cloud-explanation"><Cloud size={32} /><p><strong>Compartir entre dispositivos requiere configurar Cloud Sync.</strong></p><p>Travel OS no generará códigos ni enlaces falsos. Configura Supabase, autenticación y las políticas de acceso documentadas para habilitar invitaciones reales.</p></div><button type="button" className="secondary-button full-width" onClick={() => setModal(undefined)}>Entendido</button></section></div>
      ) : null}

      {modal?.kind === "delete" ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(undefined)}><section className="expense-modal confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-trip-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Acción permanente local</p><h2 id="delete-trip-title">Eliminar {modal.trip.name}</h2></div><Trash2 size={22} /></header><p>Escribe <strong>ELIMINAR</strong> para confirmar. Esta acción sólo afecta a este viaje local.</p><label>Confirmación<input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} autoFocus /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(undefined)}>Cancelar</button><button type="button" className="danger-button" disabled={deleteText !== "ELIMINAR"} onClick={() => { onDeleteTrip(modal.trip.id); setModal(undefined); }}>Eliminar viaje</button></div></section></div>
      ) : null}
    </div>
  );
}
function TripForm({ trip, onClose, onSubmit }: { trip?: Trip; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="expense-modal trip-form-modal" role="dialog" aria-modal="true" aria-labelledby="trip-form-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Viaje independiente</p><h2 id="trip-form-title">{trip ? "Editar viaje" : "Crear viaje"}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></header><form onSubmit={onSubmit}>
      <label>Nombre del viaje<input name="name" defaultValue={trip?.name} placeholder="Ej. México 2027" required autoFocus /></label>
      <div className="form-grid"><label>País<select name="countryId" defaultValue={trip?.countryId ?? "mexico"}>{selectableCountries.map((id) => <option value={id} key={id}>{countryThemeById[id].flag} {countryThemeById[id].name}</option>)}</select></label><label>Ciudad inicial (opcional)<input name="initialCity" defaultValue={trip?.settings?.initialCity ?? ""} placeholder="Ej. Ciudad de México" /></label></div>
      <div className="form-grid"><label>Fecha inicio<input name="startDate" type="date" defaultValue={trip?.startDate} required /></label><label>Fecha final<input name="endDate" type="date" defaultValue={trip?.endDate} min={trip?.startDate} required /></label></div>
      <div className="form-grid"><label>Moneda principal<select name="currency" defaultValue={trip?.budget.currency ?? "MXN"}>{currencies.map((currency) => <option value={currency} key={currency}>{currency}</option>)}</select></label><label>Zona horaria de destino<input name="destinationTimeZone" defaultValue={trip?.settings?.destinationTimeZone ?? "America/Mexico_City"} placeholder="America/Mexico_City" required /></label></div>
      <label>Participantes <small>Separados por coma</small><input name="participants" defaultValue={trip?.participants.map((participant) => participant.name).join(", ")} placeholder="Andy, Ana" required /></label>
      <label>Nombre del usuario creador<input name="creatorName" defaultValue={trip?.settings?.creatorName ?? "Andy"} required /></label>
      <p className="data-note">El viaje nuevo comienza sin itinerario, gastos, reservas, fotos ni datos de Japón.</p>
      <button type="submit" className="primary-button full-width">{trip ? "Guardar cambios" : "Crear viaje"}</button>
    </form></section></div>
  );
}
