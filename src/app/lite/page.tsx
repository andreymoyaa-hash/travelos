"use client";

import { useEffect, useMemo, useState } from "react";
import { japan2026Trip } from "@/data/trips/japan-2026";
import type { TripDay } from "@/types/travel";

const STORAGE_KEY = "nioli-lite-japan-2026-v1";
const initialDays = japan2026Trip.itinerary;
const EXPENSES_KEY = "nioli-lite-expenses-2026-v1";
type Receipt = { id: string; title: string; amount: number; currency: "JPY" | "CRC" | "USD"; category: string; date: string; note: string; hasPhoto: boolean; };
const categories = ["Comida", "Transporte", "Compras", "Souvenirs", "Entradas", "Hotel", "Otros"];
function openReceiptDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("nioli-lite-receipts", 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("photos")) request.result.createObjectStore("photos"); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function storeReceiptPhoto(id: string, photo: File) {
  const db = await openReceiptDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").put(photo, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}
async function readReceiptPhoto(id: string): Promise<Blob | undefined> {
  const db = await openReceiptDB();
  try {
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const request = db.transaction("photos", "readonly").objectStore("photos").get(id);
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
async function removeReceiptPhoto(id: string) {
  const db = await openReceiptDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("photos", "readwrite");
      tx.objectStore("photos").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}


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
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptTitle, setReceiptTitle] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptCurrency, setReceiptCurrency] = useState<Receipt["currency"]>("JPY");
  const [receiptCategory, setReceiptCategory] = useState("Comida");
  const [receiptDate, setReceiptDate] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"plan" | "gastos">("plan");

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
    try {
      const savedReceipts = JSON.parse(localStorage.getItem(EXPENSES_KEY) || "[]");
      if (Array.isArray(savedReceipts)) setReceipts(savedReceipts);
    } catch { /* Keep receipts blank on corrupted storage. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  }, [days, ready]);

  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(EXPENSES_KEY, JSON.stringify(receipts)); }
      catch { setReceiptError("No hay espacio suficiente para guardar gastos en este navegador."); }
    }
  }, [receipts, ready]);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    Promise.all(receipts.filter((receipt) => receipt.hasPhoto).map(async (receipt) => {
      try {
        const blob = await readReceiptPhoto(receipt.id);
        if (!blob) return null;
        const url = URL.createObjectURL(blob);
        urls.push(url);
        return { id: receipt.id, url };
      } catch { return null; }
    })).then((results) => {
      if (!cancelled) setPhotoUrls(Object.fromEntries(results.filter((result): result is { id: string; url: string } => result !== null).map((result) => [result.id, result.url])));
    });
    return () => { cancelled = true; urls.forEach(URL.revokeObjectURL); };
  }, [receipts]);

  const totals = useMemo(() => receipts.reduce<Record<string, number>>((acc, receipt) => {
    acc[receipt.currency] = (acc[receipt.currency] || 0) + receipt.amount;
    return acc;
  }, {}), [receipts]);

  async function addReceipt() {
    setReceiptError("");
    const amount = Number(receiptAmount);
    if (!receiptTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      setReceiptError("Ingresa un concepto y un monto válido mayor que cero.");
      return;
    }
    if (receiptFile && (!receiptFile.type.startsWith("image/") || receiptFile.size > 10_000_000)) {
      setReceiptError("Adjunta una foto de hasta 10 MB (JPG, PNG o similar).");
      return;
    }
    const id = "receipt-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    if (receiptFile) {
      try { await storeReceiptPhoto(id, receiptFile); }
      catch {
        setReceiptError("No pude guardar la foto. Comprueba el almacenamiento del navegador.");
        return;
      }
    }
    setReceipts((current) => [{ id, title: receiptTitle.trim(), amount, currency: receiptCurrency, category: receiptCategory, date: receiptDate || selectedDate, note: receiptNote.trim(), hasPhoto: Boolean(receiptFile) }, ...current]);
    setReceiptTitle(""); setReceiptAmount(""); setReceiptNote(""); setReceiptFile(null);
    const input = document.getElementById("receipt-photo") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function deleteReceipt(id: string) {
    if (!window.confirm("¿Eliminar este gasto y su foto?")) return;
    try { await removeReceiptPhoto(id); } catch { /* The metadata can still be removed. */ }
    setReceipts((current) => current.filter((receipt) => receipt.id !== id));
  }

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
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), days, receipts, note: "Las fotos quedan almacenadas localmente en este navegador y no se incluyen en este JSON." }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nioli-lite-japon-2026.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function askGemini() {
    if (!day || !assistantText.trim() || aiLoading) return;
    setAiLoading(true); setAiAnswer(""); setAiError("");
    const context = [
      "Fecha: " + day.date, "Ciudad: " + day.city, "Zona: " + day.area,
      "Reserva: " + (day.reservationNote || "Sin nota"),
      "Notas: " + (day.notes || ""),
      ...day.activities.map((activity) => (activity.startTime || "Flexible") + " · " + activity.title + (activity.notes ? " · " + activity.notes : "")),
    ].join("\\n").slice(0, 9500);
    try {
      const result = await fetch("/api/lite-assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: assistantText.trim(), context }),
      });
      const data = await result.json();
      if (!result.ok || !data.answer) throw new Error(data.error || "Error al consultar Gemini.");
      setAiAnswer(data.answer);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Error de conexión.");
    } finally { setAiLoading(false); }
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

  const surface = "rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm shadow-indigo-100/50";
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-violet-50/60 to-rose-50 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-500 p-6 text-white shadow-lg shadow-violet-200">
          <p className="text-sm font-semibold tracking-widest text-indigo-100">NIOLI LITE · JAPÓN 2026</p>
          <h1 className="text-3xl font-bold">Tu viaje, sin complicaciones</h1>
          <p className="text-sm text-indigo-100">Itinerario local · rutas en Google Maps · puente con ChatGPT</p>
        </header>
        <nav aria-label="Secciones Nioli Lite" className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-2 shadow-sm">
          <button onClick={() => setActiveTab("plan")} className={activeTab === "plan" ? "rounded-xl bg-indigo-700 px-4 py-3 font-semibold text-white" : "rounded-xl px-4 py-3 font-semibold text-indigo-700"}>🗺️ Itinerario</button>
          <button onClick={() => setActiveTab("gastos")} className={activeTab === "gastos" ? "rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white" : "rounded-xl px-4 py-3 font-semibold text-emerald-700"}>🧾 Facturas y gastos</button>
        </nav>
        {activeTab === "plan" && <>
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
          <h2 className="text-lg font-bold">✨ Asistente de viaje con Gemini</h2>
          <p className="mt-1 text-sm text-slate-600">Pregunta por tu día. Gemini propone ideas, pero no modifica reservas ni actividades automáticamente. No escribas datos privados o números de reserva.</p>
          <textarea aria-label="Petición para ChatGPT" rows={3} value={assistantText} onChange={(event) => { setAssistantText(event.target.value); setCopied(false); }} placeholder="Ej. Reordena Kyoto para caminar menos, respetando mis reservas" className="mt-3 w-full rounded-xl border border-slate-300 p-3" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={() => { void askGemini(); }} disabled={aiLoading || !assistantText.trim()} className="rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{aiLoading ? "Consultando..." : "Preguntar a Gemini"}</button>
            <button onClick={copyForChatGPT} className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 font-semibold text-indigo-800">{copied ? "Copiado" : "Usar en ChatGPT Plus"}</button>
          </div>
          {aiError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{aiError}</p>}
          {aiAnswer && <div aria-live="polite" className="mt-3 whitespace-pre-wrap rounded-xl bg-violet-50 p-4 text-sm leading-relaxed text-violet-950">{aiAnswer}</div>}
        </section>
        </>}
        {activeTab === "gastos" && <>
          <section className={surface}>
            <div className="mb-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white">
              <h2 className="text-xl font-bold">Facturas y gastos</h2>
              <p className="text-sm text-emerald-50">Registra compras y guarda una foto de cada recibo.</p>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {(["JPY", "CRC", "USD"] as const).map((currency) => <div key={currency} className="rounded-xl bg-emerald-50 p-3 text-center">
                <p className="text-xs font-semibold text-emerald-800">{currency}</p>
                <p className="break-all text-lg font-bold text-emerald-950">{(totals[currency] || 0).toLocaleString("es-CR")}</p>
              </div>)}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void addReceipt(); }} className="grid gap-3">
              <label className="grid gap-1 text-sm font-semibold">¿Qué compraste?
                <input required value={receiptTitle} onChange={(event) => setReceiptTitle(event.target.value)} placeholder="Ej. Almuerzo en Osaka" className="rounded-xl border border-slate-300 p-3 font-normal" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm font-semibold">Monto
                  <input required type="number" min="0.01" step="any" value={receiptAmount} onChange={(event) => setReceiptAmount(event.target.value)} placeholder="1500" className="min-w-0 rounded-xl border border-slate-300 p-3 font-normal" />
                </label>
                <label className="grid gap-1 text-sm font-semibold">Moneda
                  <select value={receiptCurrency} onChange={(event) => setReceiptCurrency(event.target.value as Receipt["currency"])} className="min-w-0 rounded-xl border border-slate-300 p-3 font-normal">
                    <option value="JPY">JPY · ¥</option><option value="CRC">CRC · ₡</option><option value="USD">USD · $</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm font-semibold">Categoría
                  <select value={receiptCategory} onChange={(event) => setReceiptCategory(event.target.value)} className="min-w-0 rounded-xl border border-slate-300 p-3 font-normal">{categories.map((category) => <option key={category}>{category}</option>)}</select>
                </label>
                <label className="grid gap-1 text-sm font-semibold">Fecha
                  <input type="date" value={receiptDate || selectedDate} onChange={(event) => setReceiptDate(event.target.value)} className="min-w-0 rounded-xl border border-slate-300 p-3 font-normal" />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-semibold">Foto del recibo (opcional)
                <input id="receipt-photo" type="file" accept="image/*" capture="environment" onChange={(event) => setReceiptFile(event.target.files?.[0] || null)} className="w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-3 font-normal" />
              </label>
              <label className="grid gap-1 text-sm font-semibold">Nota (opcional)
                <input value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} placeholder="Tienda, artículo, quién pagó..." className="rounded-xl border border-slate-300 p-3 font-normal" />
              </label>
              {receiptError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{receiptError}</p>}
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white">Guardar factura o gasto</button>
            </form>
          </section>
          <section className={surface}>
            <h2 className="mb-3 text-lg font-bold">Mis registros ({receipts.length})</h2>
            {receipts.length === 0 && <p className="text-sm text-slate-600">Todavía no tienes gastos registrados.</p>}
            <div className="space-y-3">{receipts.map((receipt) => <article key={receipt.id} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <div className="flex items-start justify-between gap-3"><div>
                <p className="font-semibold">{receipt.title}</p>
                <p className="text-sm text-slate-600">{receipt.date} · {receipt.category}</p>
                <p className="font-bold text-emerald-800">{receipt.currency} {receipt.amount.toLocaleString("es-CR")}</p>
                {receipt.note && <p className="mt-1 text-sm">{receipt.note}</p>}
              </div><button aria-label={"Eliminar " + receipt.title} onClick={() => { void deleteReceipt(receipt.id); }} className="rounded-lg bg-white px-3 py-2 text-sm text-rose-700">Eliminar</button></div>
              {photoUrls[receipt.id] && <a href={photoUrls[receipt.id]} target="_blank" rel="noopener noreferrer"><img src={photoUrls[receipt.id]} alt={"Recibo: " + receipt.title} className="mt-3 max-h-64 w-full rounded-xl object-contain" /></a>}
              {receipt.hasPhoto && !photoUrls[receipt.id] && <p className="mt-2 text-xs text-amber-700">Foto no disponible en este navegador.</p>}
            </article>)}</div>
          </section>
        </>}
        <section className={surface}>
          <h2 className="font-semibold">Respaldo de tu viaje</h2>
          <p className="my-2 text-sm text-slate-600">El itinerario y los gastos se guardan en este navegador. Las fotos de facturas se guardan por separado en el dispositivo y NO se incluyen en el respaldo JSON. Consérvalas también en tu galería.</p>
          <button onClick={exportData} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold">Exportar JSON</button>
          <button onClick={() => { if (window.confirm("¿Restaurar el itinerario original? Se borrarán los cambios guardados en este navegador.")) setDays(initialDays); }} className="ml-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold">Restaurar original</button>
        </section>
        <footer className="pb-5 text-xs text-slate-500">Versión inicial independiente. No modifica la aplicación Nioli principal ni confirma compras o reservas.</footer>
      </div>
    </main>
  );
}
