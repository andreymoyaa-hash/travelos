"use client";

import { useEffect, useMemo, useState } from "react";
import { japan2026Trip } from "@/data/trips/japan-2026";
import type { TripDay } from "@/types/travel";

const STORAGE_KEY = "nioli-lite-japan-2026-v1";
const initialDays = japan2026Trip.itinerary;

function googleMapsUrl(name: string, city: string) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(name + ", " + city + ", Japan");
}

export default function NioliLite() {
  const [days, setDays] = useState<TripDay[]>(initialDays);
  const [selectedDate, setSelectedDate] = useState(initialDays[0]?.date ?? "");
  const [ready, setReady] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((day) => typeof day?.date === "string" && Array.isArray(day?.activities))) {
          setDays(parsed as TripDay[]);
        }
      }
    } catch { /* Keep official itinerary when browser storage is corrupt. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  }, [days, ready]);

  const day = useMemo(() => days.find((item) => item.date === selectedDate), [days, selectedDate]);

  function updateDay(update: (current: TripDay) => TripDay) {
    setDays((current) => current.map((item) => item.date === selectedDate ? update(item) : item));
  }

  function addActivity() {
    const title = newTitle.trim();
    if (!title || !day) return;
    updateDay((current) => ({
      ...current,
      activities: [...current.activities, {
        id: "lite-" + Date.now(),
        title,
        date: current.date,
        category: "leisure",
        categories: ["leisure"],
        city: current.city,
        location: { name: title, address: null, latitude: null, longitude: null, placeId: null },
      }],
    }));
    setNewTitle("");
  }

  function moveActivity(index: number, direction: number) {
    updateDay((current) => {
      const activities = [...current.activities];
      const target = index + direction;
      if (target < 0 || target >= activities.length) return current;
      [activities[index], activities[target]] = [activities[target], activities[index]];
      return { ...current, activities };
    });
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), days }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nioli-lite-japon-2026.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyForChatGPT() {
    if (!day) return;
    const prompt = [
      "Soy Andy. Ayúdame a organizar este día de mi viaje a Japón. No cambies reservas ni horarios fijos sin pedirme permiso.",
      "Devuélveme una propuesta concreta y explica qué moverías. No inventes disponibilidad ni tiempos de transporte.",
      "Fecha: " + day.date + " · " + day.city + " · " + day.area,
      "Actividades: " + day.activities.map((activity) => (activity.startTime ? activity.startTime + " " : "") + activity.title).join(" | "),
      "Petición: " + (assistantText.trim() || "Optimiza el orden del día evitando vueltas innecesarias."),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
      window.prompt("Copia este mensaje y pégalo en ChatGPT:", prompt);
    }
  }

  const surface = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <header className="space-y-1">
          <p className="text-sm font-semibold tracking-widest text-indigo-600">NIOLI LITE · JAPÓN 2026</p>
          <h1 className="text-3xl font-bold">Tu viaje, sin complicaciones</h1>
          <p className="text-sm text-slate-600">Itinerario local · rutas en Google Maps · puente con ChatGPT</p>
        </header>
        <section className={surface}>
          <label htmlFor="day" className="mb-2 block font-semibold">Selecciona el día</label>
          <select id="day" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full rounded-xl border border-slate-300 p-3">
            {days.map((item) => <option key={item.date} value={item.date}>{item.date} · {item.city} · {item.area}</option>)}
          </select>
        </section>
        {day && <section className={surface}>
          <h2 className="text-xl font-bold">{day.area}</h2>
          <p className="mt-1 text-sm text-slate-600">{day.city} · {day.date}</p>
          {day.reservationNote && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Reserva: {day.reservationNote}</p>}
          {day.keyNote && <p className="mt-3 text-sm">{day.keyNote}</p>}
          {day.notes && <p className="mt-2 text-sm text-slate-600">{day.notes}</p>}
          <h3 className="mb-3 mt-5 font-semibold">Actividades ({day.activities.length})</h3>
          <div className="space-y-3">
            {day.activities.map((activity, index) => <article key={activity.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start gap-3">
                <input aria-label={"Completar " + activity.title} type="checkbox" checked={Boolean(activity.completed)} onChange={(event) => updateDay((current) => ({ ...current, activities: current.activities.map((item) => item.id === activity.id ? { ...item, completed: event.target.checked } : item) }))} className="mt-1 h-5 w-5" />
                <div className="min-w-0 flex-1">
                  <p className={activity.completed ? "font-medium line-through opacity-60" : "font-medium"}>{activity.startTime ? activity.startTime + " · " : ""}{activity.title}</p>
                  {activity.notes && <p className="mt-1 text-sm text-slate-600">{activity.notes}</p>}
                  <a href={googleMapsUrl(activity.location.name || activity.title, day.city)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-indigo-700 underline">Abrir en Google Maps</a>
                </div>
                <div className="flex flex-col gap-1">
                  <button aria-label={"Subir " + activity.title} disabled={index === 0} onClick={() => moveActivity(index, -1)} className="rounded-lg bg-slate-100 px-3 py-1 disabled:opacity-30">↑</button>
                  <button aria-label={"Bajar " + activity.title} disabled={index === day.activities.length - 1} onClick={() => moveActivity(index, 1)} className="rounded-lg bg-slate-100 px-3 py-1 disabled:opacity-30">↓</button>
                </div>
              </div>
            </article>)}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); addActivity(); }} className="mt-4 flex gap-2">
            <input aria-label="Nueva actividad" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Añadir actividad" className="min-w-0 flex-1 rounded-xl border border-slate-300 p-3" />
            <button type="submit" className="rounded-xl bg-indigo-700 px-4 font-semibold text-white">Añadir</button>
          </form>
        </section>}
        <section className={surface}>
          <h2 className="text-lg font-bold">Consultar conmigo en ChatGPT</h2>
          <p className="mt-1 text-sm text-slate-600">Esta primera versión copia el contexto del día y tu pregunta. La integración directa de IA aún no está conectada.</p>
          <textarea aria-label="Petición para ChatGPT" rows={3} value={assistantText} onChange={(event) => { setAssistantText(event.target.value); setCopied(false); }} placeholder="Ej. Reordena Kyoto para caminar menos, respetando mis reservas" className="mt-3 w-full rounded-xl border border-slate-300 p-3" />
          <button onClick={copyForChatGPT} className="mt-2 rounded-xl bg-indigo-700 px-4 py-3 font-semibold text-white">{copied ? "Copiado: pégalo en ChatGPT" : "Copiar consulta para ChatGPT"}</button>
        </section>
        <section className={surface}>
          <h2 className="font-semibold">Respaldo de tu viaje</h2>
          <p className="my-2 text-sm text-slate-600">Los cambios se guardan solamente en este navegador. Exporta un respaldo, especialmente antes de limpiar datos o cambiar de teléfono.</p>
          <button onClick={exportData} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold">Exportar JSON</button>
          <button onClick={() => { if (window.confirm("¿Restaurar el itinerario original? Se borrarán los cambios guardados en este navegador.")) setDays(initialDays); }} className="ml-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold">Restaurar original</button>
        </section>
        <footer className="pb-5 text-xs text-slate-500">Versión inicial independiente. No modifica la aplicación Nioli principal ni confirma compras o reservas.</footer>
      </div>
    </main>
  );
}
