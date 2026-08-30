"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarDays, Cloud, FolderPlus, LoaderCircle, LogOut, MapPin, X } from "lucide-react";

import { countryThemes } from "@/data/countries";
import type { TravelSession, TravelWorkspaceSession, WorkspaceTripSummary } from "@/types/cloud";
import type { Currency } from "@/types/travel";

const currencies: Currency[] = ["JPY", "MXN", "COP", "USD", "EUR", "CLP", "ARS", "KRW", "CRC"];
const destinations = countryThemes.filter((theme) => theme.countryCode !== "XX");

export function GuestWorkspaceView({ session, onOpenSession, onLogout }: {
  session: TravelWorkspaceSession;
  onOpenSession: (session: TravelSession) => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const [trips, setTrips] = useState<WorkspaceTripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try {
      const response = await fetch("/api/travel-workspace", { cache: "no-store" });
      const payload = await response.json() as { trips?: WorkspaceTripSummary[]; error?: string };
      if (!response.ok || !payload.trips) throw new Error(payload.error ?? "No se pudieron cargar los viajes.");
      setTrips(payload.trips);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron cargar los viajes.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const requestTrip = async (body: Record<string, unknown>) => {
    setWorking(true); setError(undefined);
    try {
      const response = await fetch("/api/travel-workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => ({})) as TravelSession & { error?: string };
      if (!response.ok || !payload.trip) throw new Error(payload.error ?? "No se pudo abrir el viaje.");
      await onOpenSession(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo abrir el viaje.");
    } finally { setWorking(false); }
  };

  const createTrip = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCreateOpen(false);
    void requestTrip({
      action: "create",
      name: String(form.get("name") ?? "").trim(),
      countryCode: form.get("countryCode"),
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      currency: form.get("currency"),
      destinationTimeZone: String(form.get("destinationTimeZone") ?? "").trim(),
    });
  };

  return (
    <main className="auth-screen workspace-screen">
      <section className="workspace-card" aria-labelledby="workspace-title">
        <header className="trips-heading"><div><p className="eyebrow">NIOLI personal</p><h1 id="workspace-title">Tus viajes</h1><p>Hola, {session.profile.name}. Aquí puedes crear y organizar tus propios viajes.</p></div><div className="heading-actions"><button type="button" className="secondary-button" onClick={() => void onLogout()}><LogOut size={17} /> Cambiar usuario</button><button type="button" className="primary-button" onClick={() => setCreateOpen(true)}><FolderPlus size={17} /> Crear viaje</button></div></header>
        <div className="mode-banner"><Cloud size={19} /><div><strong>Tu espacio personal</strong><p>No tienes acceso a los viajes ni al contenido de otros usuarios. Tus datos personales permanecen privados.</p></div></div>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        {loading ? <div className="empty-state compact"><LoaderCircle className="auth-spinner" size={28} /><p>Cargando viajes…</p></div> : trips.length ? <div className="trip-manager-grid">{trips.map((trip) => <article className="trip-manager-card" key={trip.id}><header><span className="trip-card-flag">{countryThemes.find((theme) => theme.countryCode === trip.countryCode)?.flag ?? "🌎"}</span><span className="storage-pill">{trip.mapProvider === "google" ? "Google Maps" : "OpenStreetMap"}</span></header><h2>{trip.name}</h2><p>{trip.startDate && trip.endDate ? `${trip.startDate} — ${trip.endDate}` : "Fechas pendientes"}</p><div className="trip-card-facts"><span><MapPin size={15} /> {countryThemes.find((theme) => theme.countryCode === trip.countryCode)?.name ?? trip.countryCode}</span><span><CalendarDays size={15} /> Datos independientes</span></div><footer><button type="button" className="primary-button" disabled={working} onClick={() => void requestTrip({ action: "open", tripId: trip.id })}>{working ? "Abriendo…" : "Abrir viaje"}</button></footer></article>)}</div> : <div className="empty-state"><FolderPlus size={32} /><h2>Este espacio todavía no tiene viajes</h2><p>Crea el primero. Comenzará sin itinerario, reservas, gastos, fotos ni sellos heredados.</p><button type="button" className="primary-button" onClick={() => setCreateOpen(true)}>Crear primer viaje</button></div>}
      </section>

      {createOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setCreateOpen(false)}><section className="expense-modal trip-form-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-trip-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Viaje independiente</p><h2 id="workspace-trip-title">Crear viaje</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setCreateOpen(false)}><X size={20} /></button></header><form onSubmit={createTrip}><label>Nombre del viaje<input name="name" required autoFocus /></label><div className="form-grid"><label>País<select name="countryCode" defaultValue="MX">{destinations.map((theme) => <option value={theme.countryCode} key={theme.id}>{theme.flag} {theme.name}</option>)}</select></label><label>Moneda<select name="currency" defaultValue="USD">{currencies.map((currency) => <option value={currency} key={currency}>{currency}</option>)}</select></label></div><div className="form-grid"><label>Fecha inicio<input name="startDate" type="date" required /></label><label>Fecha final<input name="endDate" type="date" required /></label></div><label>Zona horaria del destino<input name="destinationTimeZone" defaultValue="America/Mexico_City" required /></label><p className="data-note">Los nuevos viajes utilizan OpenStreetMap por defecto. Google Maps sigue disponible cuando el viaje está configurado con ese proveedor.</p><button type="submit" className="primary-button full-width">Crear y abrir</button></form></section></div> : null}
    </main>
  );
}
