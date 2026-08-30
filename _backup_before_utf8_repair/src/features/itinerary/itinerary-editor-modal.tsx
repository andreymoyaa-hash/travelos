"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { X } from "lucide-react";

import type {
  Activity,
  ActivityCategory,
  Currency,
  Reservation,
  TripBase,
  TripDay,
  TripDayType,
} from "@/types/travel";

export type ItineraryEditorState =
  | { kind: "activity"; dayId: string; activity?: Activity }
  | { kind: "day"; dayId: string }
  | { kind: "base"; baseId: string };

interface ItineraryEditorModalProps {
  editor: ItineraryEditorState;
  itinerary: TripDay[];
  bases: TripBase[];
  reservations: Reservation[];
  onClose: () => void;
  onSaveActivity: (dayId: string, activity: Activity) => void;
  onSaveDay: (dayId: string, update: Partial<TripDay>) => void;
  onSaveBase: (base: TripBase) => void;
  defaultCurrency: Currency;
}

const categories: Array<{ id: ActivityCategory; label: string }> = [
  { id: "travel", label: "✈️ Viaje" },
  { id: "transport", label: "🚄 Transporte" },
  { id: "food", label: "🍜 Comida" },
  { id: "geek", label: "👾 Geek" },
  { id: "shopping", label: "🛍️ Compras" },
  { id: "culture", label: "⛩️ Cultura" },
  { id: "temple", label: "🏯 Templo" },
  { id: "photography", label: "📷 Fotografía" },
  { id: "nature", label: "🌿 Naturaleza" },
  { id: "viewpoint", label: "🌇 Mirador" },
  { id: "gaming", label: "🎮 Gaming" },
  { id: "anime", label: "✨ Anime" },
  { id: "theme-park", label: "🎢 Parque temático" },
  { id: "leisure", label: "☕ Ocio" },
];

const dayTypes: Array<{ id: TripDayType; label: string }> = [
  { id: "standard", label: "Día estándar" },
  { id: "travel", label: "Travel Day" },
  { id: "base-transition", label: "Base Transition Day" },
  { id: "theme-park", label: "Theme Park Full Day" },
  { id: "pokemon-full-day", label: "Pokémon Full Day" },
  { id: "flexible", label: "Flexible Day" },
  { id: "relaxed", label: "Relaxed Day" },
  { id: "recovery", label: "Recovery Day" },
];

const currencies: Currency[] = ["JPY", "MXN", "USD", "CRC", "EUR"];

const daysBetween = (start: string, end: string) => Math.max(
  0,
  Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000),
);

export function ItineraryEditorModal({
  editor,
  itinerary,
  bases,
  reservations,
  onClose,
  onSaveActivity,
  onSaveDay,
  onSaveBase,
  defaultCurrency,
}: ItineraryEditorModalProps) {
  const [error, setError] = useState<string>();
  const day = editor.kind !== "base" ? itinerary.find((item) => item.id === editor.dayId) : undefined;
  const base = editor.kind === "base" ? bases.find((item) => item.id === editor.baseId) : undefined;

  if (editor.kind === "base" && base) {
    const handleBaseSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const city = String(form.get("city") || base.city).trim();
      const checkInDate = String(form.get("checkInDate") || base.checkInDate);
      const checkOutDate = String(form.get("checkOutDate") || base.checkOutDate);
      const address = String(form.get("address") || "").trim() || null;
      const priceText = String(form.get("price") || "").trim();

      if (checkOutDate <= checkInDate) {
        setError("El check-out debe ser posterior al check-in.");
        return;
      }

      onSaveBase({
        ...base,
        city,
        checkInDate,
        checkOutDate,
        nights: daysBetween(checkInDate, checkOutDate),
        status: form.get("status") as TripBase["status"],
        area: String(form.get("area") || "").trim() || null,
        location: {
          name: `Alojamiento en ${city}`,
          address,
          latitude: address === base.location.address ? base.location.latitude : null,
          longitude: address === base.location.address ? base.location.longitude : null,
          placeId: address === base.location.address ? base.location.placeId : null,
        },
        checkInTime: String(form.get("checkInTime") || "").trim() || null,
        checkOutTime: String(form.get("checkOutTime") || "").trim() || null,
        reservationCode: String(form.get("reservationCode") || "").trim() || undefined,
        provider: String(form.get("provider") || "").trim() || undefined,
        price: priceText ? Number(priceText) : undefined,
        currency: priceText ? form.get("currency") as Currency : undefined,
        reservationId: String(form.get("reservationId") || "").trim() || undefined,
      });
      onClose();
    };

    return (
      <ModalShell title={`Alojamiento · ${base.city}`} eyebrow="Base del viaje" onClose={onClose}>
        <form onSubmit={handleBaseSubmit}>
          <div className="form-grid">
            <label>Ciudad<input name="city" defaultValue={base.city} required autoFocus /></label>
            <label>Estado<select name="status" defaultValue={base.status}><option value="confirmed">Confirmado</option><option value="pending">Pendiente de agregar</option></select></label>
          </div>
          <div className="form-grid">
            <label>Entrada<input name="checkInDate" type="date" defaultValue={base.checkInDate} required /></label>
            <label>Salida<input name="checkOutDate" type="date" defaultValue={base.checkOutDate} required /></label>
          </div>
          <div className="form-grid">
            <label>Check-in<input name="checkInTime" type="time" defaultValue={base.checkInTime ?? ""} /></label>
            <label>Check-out<input name="checkOutTime" type="time" defaultValue={base.checkOutTime ?? ""} /></label>
          </div>
          <label>Zona<input name="area" defaultValue={base.area ?? ""} placeholder="Pendiente de agregar" /></label>
          <label>Dirección<input name="address" defaultValue={base.location.address ?? ""} placeholder="Pendiente de agregar" /></label>
          <div className="form-grid">
            <label>Proveedor<input name="provider" defaultValue={base.provider ?? ""} /></label>
            <label>Código de reserva<input name="reservationCode" defaultValue={base.reservationCode ?? ""} /></label>
          </div>
          <div className="form-grid">
            <label>Precio<input name="price" type="number" min="0" step="0.01" defaultValue={base.price ?? ""} /></label>
            <label>Moneda<select name="currency" defaultValue={base.currency ?? defaultCurrency}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          </div>
          <label>Vincular reserva<select name="reservationId" defaultValue={base.reservationId ?? ""}><option value="">Sin reserva vinculada</option>{reservations.filter((reservation) => reservation.type === "hotel").map((reservation) => <option value={reservation.id} key={reservation.id}>{reservation.title} · {reservation.date}</option>)}</select></label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button full-width">Guardar alojamiento</button>
        </form>
      </ModalShell>
    );
  }

  if (editor.kind === "day" && day) {
    const handleDaySubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const date = String(form.get("date") || day.date);
      if (itinerary.some((item) => item.id !== day.id && item.date === date)) {
        setError("Ya existe otro día con esa fecha.");
        return;
      }

      const dayType = form.get("dayType") as TripDayType;
      onSaveDay(day.id, {
        date,
        city: String(form.get("city") || day.city).trim(),
        visitedCity: String(form.get("visitedCity") || "").trim() || undefined,
        baseId: String(form.get("baseId") || "").trim() || undefined,
        previousBaseId: String(form.get("previousBaseId") || "").trim() || undefined,
        area: String(form.get("area") || day.area).trim(),
        dayType,
        notes: String(form.get("notes") || "").trim() || undefined,
        hiddenGem: String(form.get("hiddenGem") || "").trim() || undefined,
        flexible: form.get("flexible") === "on" || dayType === "flexible",
      });
      onClose();
    };

    return (
      <ModalShell title="Editar día" eyebrow={day.date} onClose={onClose}>
        <form onSubmit={handleDaySubmit}>
          <div className="form-grid">
            <label>Fecha<input name="date" type="date" defaultValue={day.date} required /></label>
            <label>Tipo<select name="dayType" defaultValue={day.dayType}>{dayTypes.map((type) => <option value={type.id} key={type.id}>{type.label}</option>)}</select></label>
          </div>
          <div className="form-grid">
            <label>Ciudad<input name="city" defaultValue={day.city} required /></label>
            <label>Ciudad visitada<input name="visitedCity" defaultValue={day.visitedCity ?? ""} placeholder="Opcional" /></label>
          </div>
          <label>Nombre del plan<input name="area" defaultValue={day.area} required autoFocus /></label>
          <div className="form-grid">
            <label>Base<select name="baseId" defaultValue={day.baseId ?? ""}><option value="">Travel / Flight</option>{bases.map((item) => <option value={item.id} key={item.id}>{item.city}</option>)}</select></label>
            <label>Base anterior<select name="previousBaseId" defaultValue={day.previousBaseId ?? ""}><option value="">Ninguna</option>{bases.map((item) => <option value={item.id} key={item.id}>{item.city}</option>)}</select></label>
          </div>
          <label>Nota<textarea name="notes" defaultValue={day.notes ?? ""} rows={3} /></label>
          <label>Hidden gem<textarea name="hiddenGem" defaultValue={day.hiddenGem ?? ""} rows={2} /></label>
          <label className="checkbox-label"><input name="flexible" type="checkbox" defaultChecked={day.flexible} /> Mantener este día especialmente flexible</label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button full-width">Guardar día</button>
        </form>
      </ModalShell>
    );
  }

  if (editor.kind === "activity" && day) {
    const current = editor.activity;
    const handleActivitySubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const category = form.get("category") as ActivityCategory;
      const locationName = String(form.get("location") || "Por definir").trim();
      const address = String(form.get("address") || "").trim() || null;
      const costText = String(form.get("estimatedCost") || "").trim();
      const locationUnchanged = current?.location.name === locationName && current.location.address === address;

      onSaveActivity(day.id, {
        id: current?.id ?? `activity-${crypto.randomUUID()}`,
        title: String(form.get("title") || "Nueva actividad").trim(),
        date: day.date,
        startTime: String(form.get("startTime") || "").trim() || undefined,
        endTime: String(form.get("endTime") || "").trim() || undefined,
        city: String(form.get("city") || day.visitedCity || day.city).trim(),
        category,
        categories: current ? Array.from(new Set([category, ...current.categories])) : [category],
        location: {
          name: locationName,
          address,
          latitude: locationUnchanged ? current?.location.latitude ?? null : null,
          longitude: locationUnchanged ? current?.location.longitude ?? null : null,
          placeId: locationUnchanged ? current?.location.placeId ?? null : null,
        },
        estimatedCost: costText ? Number(costText) : undefined,
        currency: costText ? form.get("currency") as Currency : undefined,
        notes: String(form.get("notes") || "").trim() || undefined,
        optional: form.get("optional") === "on",
        hiddenGem: form.get("hiddenGem") === "on",
        completed: current?.completed,
        reservationId: String(form.get("reservationId") || "").trim() || undefined,
        stampId: String(form.get("stampId") || "").trim() || undefined,
        flightSegmentId: current?.flightSegmentId,
      });
      onClose();
    };

    return (
      <ModalShell title={current ? "Editar actividad" : "Nueva actividad"} eyebrow={`${day.weekday} ${day.dayNumber} · ${day.area}`} onClose={onClose}>
        <form onSubmit={handleActivitySubmit}>
          <label>Actividad<input name="title" defaultValue={current?.title ?? ""} required autoFocus /></label>
          <div className="form-grid">
            <label>Hora inicial<input name="startTime" type="time" defaultValue={current?.startTime ?? ""} /></label>
            <label>Hora final<input name="endTime" type="time" defaultValue={current?.endTime ?? ""} /></label>
          </div>
          <div className="form-grid">
            <label>Categoría<select name="category" defaultValue={current?.category ?? "culture"}>{categories.map((category) => <option value={category.id} key={category.id}>{category.label}</option>)}</select></label>
            <label>Ciudad<input name="city" defaultValue={current?.city ?? day.visitedCity ?? day.city} /></label>
          </div>
          <label>Lugar<input name="location" defaultValue={current?.location.name ?? ""} placeholder="Nombre del lugar" required /></label>
          <label>Dirección<input name="address" defaultValue={current?.location.address ?? ""} placeholder="Opcional; coordenadas quedan pendientes" /></label>
          <div className="form-grid">
            <label>Costo estimado<input name="estimatedCost" type="number" min="0" step="0.01" defaultValue={current?.estimatedCost ?? ""} /></label>
            <label>Moneda<select name="currency" defaultValue={current?.currency ?? defaultCurrency}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          </div>
          <label>Nota<textarea name="notes" defaultValue={current?.notes ?? ""} rows={3} /></label>
          <label>Vincular reserva<select name="reservationId" defaultValue={current?.reservationId ?? ""}><option value="">Sin reserva vinculada</option>{reservations.map((reservation) => <option value={reservation.id} key={reservation.id}>{reservation.title} · {reservation.date}</option>)}</select></label>
          <label>Nioli Passport stamp ID<input name="stampId" defaultValue={current?.stampId ?? ""} placeholder="Ej. jp-kyoto-fushimi-inari" /></label>
          <div className="checkbox-row">
            <label className="checkbox-label"><input name="optional" type="checkbox" defaultChecked={current?.optional} /> Actividad opcional</label>
            <label className="checkbox-label"><input name="hiddenGem" type="checkbox" defaultChecked={current?.hiddenGem} /> Hidden gem</label>
          </div>
          <button type="submit" className="primary-button full-width">{current ? "Guardar cambios" : "Añadir al itinerario"}</button>
        </form>
      </ModalShell>
    );
  }

  return null;
}

function ModalShell({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="expense-modal itinerary-editor-modal" role="dialog" aria-modal="true" aria-labelledby="itinerary-editor-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><p className="eyebrow">{eyebrow}</p><h2 id="itinerary-editor-title">{title}</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={20} /></button></header>
        {children}
      </section>
    </div>
  );
}
