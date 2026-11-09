"use client";

import { useEffect, useMemo, useState } from "react";
import { japan2026Trip } from "@/data/trips/japan-2026";
import LiteCloudSync, { type LiteReceipt } from "./cloud-sync";
import LiteJourneyHero from "./journey-hero";
import type { TripDay } from "@/types/travel";
import { activityMapTarget, mapsDirectionsUrl, transferLegs, androidMapLocationUri } from "@/lib/lite-maps";

const STORAGE_KEY = "nioli-lite-japan-2026-v1";
const initialDays = japan2026Trip.itinerary;
const EXPENSES_KEY = "nioli-lite-expenses-2026-v1";
type Receipt = LiteReceipt;
type ChatTurn = { role: "user" | "model"; text: string };
type GeminiWebSource = { title: string; url: string };
const CHAT_STORE_PREFIX = "nioli-lite-gemini-chat-v2:";
type FxRates = { perUSD: { USD: number; JPY: number; CRC: number }; asOf: string | null; source: string };
type Recognition = { merchant: string | null; total: number | null; currency: Receipt["currency"] | null; date: string | null; confidence: "high" | "medium" | "low"; warning: string | null };
function validRates(value: unknown): value is FxRates {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<FxRates>;
  return !!r.perUSD && (["USD","JPY","CRC"] as const).every(key => Number.isFinite(r.perUSD?.[key]) && (r.perUSD?.[key] || 0) > 0);
}
function fmtMoney(value: number, currency: Receipt["currency"]) {
  return new Intl.NumberFormat("es-CR", { maximumFractionDigits: currency === "USD" ? 2 : 0, minimumFractionDigits: currency === "USD" ? 2 : 0 }).format(value);
}
function convert(amount: number, from: Receipt["currency"], to: Receipt["currency"], rates: FxRates) {
  return amount / rates.perUSD[from] * rates.perUSD[to];
}

const categories = ["Comida", "Transporte", "Compras", "Souvenirs", "Entradas", "Hotel", "Otros"];

// Resize phone-camera photos locally before recognition and cloud backup.
// Keeps receipt text readable while avoiding Gemini and Supabase upload limits.
async function prepareReceiptImage(original: File): Promise<File> {
  if (original.size === 0 || original.size > 70_000_000) throw new Error("La foto está vacía o supera 70 MB.");
  let bitmap: ImageBitmap | null = null;
  let image: HTMLImageElement | null = null;
  let objectUrl: string | null = null;
  try {
    if ("createImageBitmap" in window) {
      try { bitmap = await createImageBitmap(original, { imageOrientation: "from-image" }); }
      catch { /* Fall back to browser image decoding. */ }
    }
    if (!bitmap) {
      objectUrl = URL.createObjectURL(original);
      image = new Image();
      image.src = objectUrl;
      await image.decode();
    }
    const width = bitmap?.width ?? image?.naturalWidth ?? 0;
    const height = bitmap?.height ?? image?.naturalHeight ?? 0;
    if (!width || !height) throw new Error("La imagen no tiene dimensiones válidas.");
    const maxEdge = 2400;
    const factor = Math.min(1, maxEdge / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * factor));
    canvas.height = Math.max(1, Math.round(height * factor));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("El navegador no pudo procesar la fotografía.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap ?? image!, 0, 0, canvas.width, canvas.height);
    const toJpeg = (quality: number) => new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("No se pudo convertir la foto a JPG.")), "image/jpeg", quality);
    });
    let blob = await toJpeg(0.88);
    if (blob.size > 6_500_000) blob = await toJpeg(0.75);
    if (blob.size > 6_500_000) blob = await toJpeg(0.58);
    if (blob.size > 6_500_000) throw new Error("La imagen es demasiado grande incluso después de optimizarla.");
    return new File([blob], "recibo-" + Date.now() + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch (error) {
    throw new Error("Tu navegador no pudo abrir esta imagen. Prueba en la cámara el formato JPG/JPEG o toma una foto con menor resolución. " +
      (error instanceof Error && error.message.includes("70 MB") ? error.message : ""));
  } finally {
    bitmap?.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

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


async function sendRouteToAndroid(url: string, label: string): Promise<string> {
  // Sharing is initiated by a real tap, to allow the Android app picker.
  // Avoid trying to force Google Maps through browser-dependent intent redirects.
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "Ruta a " + label, text: "Ruta de Nioli Lite", url });
      return "Ruta enviada al menú de compartir. Si aparece Google Maps, elígelo.";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "Compartir cancelado.";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "Enlace copiado. Ábrelo en Chrome o compártelo desde el teléfono con Google Maps.";
  } catch {
    return "No se pudo abrir el menú de compartir. Mantén presionado «Ruta web» y usa «Copiar enlace».";
  }
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
  const [geminiWebSearch, setGeminiWebSearch] = useState(false);
  const [geminiSources, setGeminiSources] = useState<GeminiWebSource[]>([]);
  const [geminiSearched, setGeminiSearched] = useState(false);
  const [geminiSearchSuggestions, setGeminiSearchSuggestions] = useState("");
  const [chatKey, setChatKey] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatTurn[]>([]);
  const [chatError, setChatError] = useState("");
  const [clockNow, setClockNow] = useState<number | null>(null);
  const [online, setOnline] = useState(true);
  const [mapMessage, setMapMessage] = useState("");
  const [offlineReady, setOfflineReady] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptTitle, setReceiptTitle] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptCurrency, setReceiptCurrency] = useState<Receipt["currency"]>("JPY");
  const [receiptCategory, setReceiptCategory] = useState("Comida");
  const [receiptDate, setReceiptDate] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [photoInfo, setPhotoInfo] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [recognition, setRecognition] = useState<Recognition | null>(null);
  const [recognitionError, setRecognitionError] = useState("");
  const [fxRates, setFxRates] = useState<FxRates | null>(null);
  const [fxCached, setFxCached] = useState(false);
  const [fxError, setFxError] = useState("");

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"plan" | "gastos">("plan");

  // Keep conversations in this browser, isolated by server-validated participant and trip IDs.
  // Never use a global localStorage key: Andy and José may share a device.
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/travel-session", { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!response.ok || response.status === 204) throw new Error("Inicia sesión para recuperar tu chat.");
        const result: unknown = await response.json();
        const session = result && typeof result === "object" ? result as Record<string, unknown> : {};
        const participant = session.participant && typeof session.participant === "object" ? session.participant as Record<string, unknown> : {};
        const trip = session.trip && typeof session.trip === "object" ? session.trip as Record<string, unknown> : {};
        if (session.accessKind !== "trip" || trip.slug !== "japan-2026" || typeof participant.id !== "string" || typeof trip.id !== "string") {
          throw new Error("Este chat requiere tu acceso al viaje Japón 2026.");
        }
        const key = CHAT_STORE_PREFIX + trip.id + ":" + participant.id;
        let stored: ChatTurn[] = [];
        try {
          const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
          if (Array.isArray(parsed)) stored = parsed.filter((turn): turn is ChatTurn =>
            !!turn && typeof turn === "object" && (turn.role === "user" || turn.role === "model") &&
            typeof turn.text === "string" && turn.text.length <= 4000).slice(-60);
        } catch { /* Ignore unreadable local history. */ }
        if (!cancelled) { setChatMessages(stored); setChatKey(key); setChatError(""); }
      })
      .catch(error => {
        if (!cancelled) setChatError(error instanceof Error ? error.message : "No se pudo recuperar el chat.");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!chatKey) return;
    try { localStorage.setItem(chatKey, JSON.stringify(chatMessages.slice(-60))); }
    catch { setChatError("No hay espacio para guardar la conversación en este dispositivo."); }
  }, [chatKey, chatMessages]);


  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/lite-sw.js", { scope: "/lite" })
        .then(() => setOfflineReady(true))
        .catch(() => setOfflineReady(false));
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    setClockNow(Date.now());
    const interval = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

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

  useEffect(() => {
    if (activeTab !== "gastos") return;
    let cancelled = false;
    try {
      const cached = localStorage.getItem("nioli-lite-fx-cache-v1");
      if (cached) {
        const data: unknown = JSON.parse(cached);
        if (validRates(data)) { setFxRates(data); setFxCached(true); }
      }
    } catch { /* Local cache optional. */ }
    if (!navigator.onLine) {
      setFxError("Sin Internet: usando la última tasa guardada, si existe.");
      return;
    }
    void fetch("/api/lite-rates", { credentials: "same-origin", cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("No se pudieron actualizar las tasas.");
      const data: unknown = await response.json();
      if (!validRates(data)) throw new Error("Tipos de cambio inválidos.");
      if (cancelled) return;
      setFxRates(data); setFxCached(false); setFxError("");
      try { localStorage.setItem("nioli-lite-fx-cache-v1", JSON.stringify(data)); } catch {}
    }).catch(() => {
      if (!cancelled) setFxError("No se pudieron actualizar las tasas. Se usa la última tasa guardada, si existe.");
    });
    return () => { cancelled = true; };
  }, [activeTab]);

  async function selectReceiptPhoto(selected: File | null) {
    setReceiptFile(null); setRecognition(null); setRecognitionError(""); setPhotoInfo("");
    if (!selected) return;
    setPreparingPhoto(true);
    try {
      const prepared = await prepareReceiptImage(selected);
      setReceiptFile(prepared);
      setPhotoInfo("Fotografía preparada: " + (selected.size / 1_000_000).toFixed(1) + " MB → " +
        (prepared.size / 1_000_000).toFixed(1) + " MB (JPG). Lista para analizar y guardar.");
    } catch (error) {
      setRecognitionError(error instanceof Error ? error.message : "No fue posible abrir la foto.");
      const input = document.getElementById("receipt-photo") as HTMLInputElement | null;
      if (input) input.value = "";
    } finally { setPreparingPhoto(false); }
  }

  async function recognizeReceipt() {
    if (!receiptFile || recognizing || preparingPhoto) return;
    setRecognitionError(""); setReceiptError(""); setRecognition(null);
    if (!navigator.onLine) {
      setRecognitionError("El reconocimiento necesita Internet; puedes registrar los datos manualmente.");
      return;
    }
    setRecognizing(true);
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(receiptFile.type) || receiptFile.size > 7_000_000)
        throw new Error("Para reconocimiento usa JPG, PNG o WebP de máximo 7 MB.");
      const form = new FormData();
      form.append("receipt", receiptFile);
      const response = await fetch("/api/lite-receipt-recognize", { method: "POST", credentials: "same-origin", cache: "no-store", body: form });
      const data: unknown = await response.json().catch(() => null);
      const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
      if (!response.ok) throw new Error(typeof record.error === "string" ? record.error : "No se pudo reconocer la factura.");
      const info = record as Recognition;
      setRecognition(info);
      if (info.merchant) setReceiptTitle(info.merchant);
      if (info.total !== null && typeof info.total === "number" && Number.isFinite(info.total) && info.total > 0) setReceiptAmount(String(info.total));
      if (info.currency && ["JPY", "CRC", "USD"].includes(info.currency)) setReceiptCurrency(info.currency);
      if (info.date && /^\d{4}-\d{2}-\d{2}$/.test(info.date)) setReceiptDate(info.date);
      if (!info.total || !info.currency) setRecognitionError("Faltan datos. Revisa y corrige el monto y la moneda.");
    } catch (error) {
      setRecognitionError(error instanceof Error ? error.message : "No se pudo leer esta factura.");
    } finally { setRecognizing(false); }
  }

  const receiptEstimate = useMemo(() => {
    const amount = Number(receiptAmount);
    if (!fxRates || !receiptAmount.trim() || !Number.isFinite(amount) || amount <= 0) return null;
    return {
      JPY: convert(amount, receiptCurrency, "JPY", fxRates),
      CRC: convert(amount, receiptCurrency, "CRC", fxRates),
      USD: convert(amount, receiptCurrency, "USD", fxRates),
    };
  }, [receiptAmount, receiptCurrency, fxRates]);

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
    setReceiptTitle(""); setReceiptAmount(""); setReceiptNote(""); setReceiptFile(null); setRecognition(null); setRecognitionError(""); setPhotoInfo("");
    const input = document.getElementById("receipt-photo") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function deleteReceipt(id: string) {
    if (!window.confirm("¿Eliminar este gasto y su foto?")) return;
    try { await removeReceiptPhoto(id); } catch { /* The metadata can still be removed. */ }
    setReceipts((current) => current.filter((receipt) => receipt.id !== id));
  }

  const day = useMemo(() => days.find((item) => item.date === selectedDate), [days, selectedDate]);
  const nextStop = useMemo(() => {
    if (!day) return null;
    for (let index = 0; index < day.activities.length; index++) {
      const activity = day.activities[index];
      if (activity.completed) continue;
      const target = activityMapTarget(activity, day.city);
      if (target.destination) return { activity, target, index };
    }
    return null;
  }, [day]);


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

  function downloadOfflineGuide() {
    if (!window.confirm("Este archivo contiene información del viaje y NO tendrá PIN. Guárdalo solo en un dispositivo privado. ¿Descargar la guía?")) return;
    const lines = [
      "NIOLI LITE · JAPÓN 2026",
      "Guía de emergencia sin Internet · Generada: " + new Date().toLocaleString("es-CR"),
      "IMPORTANTE: este archivo no está protegido por el PIN de Nioli.",
      "Los enlaces a Google Maps requieren Internet. Verifica los horarios de transporte en la fuente oficial.",
      "",
    ];
    for (const day of days) {
      lines.push("==================================================");
      lines.push(day.date + " · " + day.city + " · " + day.area);
      if (day.reservationNote) lines.push("RESERVA: " + day.reservationNote);
      if (day.keyNote) lines.push("IMPORTANTE: " + day.keyNote);
      if (day.notes) lines.push("NOTAS: " + day.notes);
      for (const activity of day.activities) {
        lines.push(" • " + (activity.startTime ? activity.startTime + " · " : "") + activity.title);
        if (activity.notes) lines.push("    " + activity.notes);
        if (activity.location?.address) lines.push("    Dirección: " + activity.location.address);
      }
      lines.push("");
    }
    const file = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "nioli-japon-2026-sin-internet.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
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
    if (!day || !assistantText.trim() || aiLoading || !chatKey) return;
    const question = assistantText.trim();
    setAiLoading(true); setAiError(""); setChatError("");
    setGeminiSources([]); setGeminiSearched(false); setGeminiSearchSuggestions("");
    const context = [
      "Fecha: " + day.date, "Ciudad: " + day.city, "Zona: " + day.area,
      "Reserva: " + (day.reservationNote || "Sin nota"),
      "Notas: " + (day.notes || ""),
      ...day.activities.map(activity => (activity.startTime || "Flexible") + " · " + activity.title + (activity.notes ? " · " + activity.notes : "")),
    ].join("\\n").slice(0, 9500);
    const history = chatMessages.slice(-16).map(turn => ({ role: turn.role, text: turn.text.slice(0, 1400) }));
    while (history.reduce((total, item) => total + item.text.length, 0) > 9500) history.shift();
    try {
      const result = await fetch("/api/lite-assistant", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, context, history, webSearch: geminiWebSearch }),
      });
      const data = await result.json();
      if (!result.ok || typeof data.answer !== "string" || !data.answer.trim()) {
        throw new Error(data.error || "Error al consultar Gemini.");
      }
      setChatMessages(previous => [...previous, { role: "user", text: question }, { role: "model", text: data.answer.trim() }].slice(-60) as ChatTurn[]);
      setAssistantText("");
      setAiAnswer("");
      const sources: unknown = data.sources;
      setGeminiSources(Array.isArray(sources) ? sources.filter((source): source is GeminiWebSource =>
        !!source && typeof source === "object" && typeof source.url === "string" &&
        /^https?:\/\//.test(source.url) && typeof source.title === "string").slice(0, 6) : []);
      setGeminiSearched(data.searched === true);
      setGeminiSearchSuggestions(typeof data.searchEntryPoint === "string" ? data.searchEntryPoint : "");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Error de conexión.");
    } finally { setAiLoading(false); }
  }

  function clearGeminiChat() {
    if (!chatKey || aiLoading || !window.confirm("¿Borrar el historial de Gemini guardado para este participante en este navegador?")) return;
    setChatMessages([]);
    setAiAnswer("");
    setAiError("");
    setAssistantText("");
    setGeminiSources([]); setGeminiSearched(false); setGeminiSearchSuggestions("");
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

  function timeIn(zone: string) {
    if (clockNow === null) return "--:--:--";
    return new Intl.DateTimeFormat("es-CR", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(clockNow);
  }
  function dateIn(zone: string) {
    if (clockNow === null) return "Cargando fecha";
    return new Intl.DateTimeFormat("es-CR", { timeZone: zone, weekday: "short", day: "numeric", month: "short" }).format(clockNow);
  }

  const surface = "rounded-[24px] border border-[#e6e1d6] bg-white p-4 shadow-[0_12px_28px_-26px_rgba(29,57,39,0.55)] sm:p-5";
  return (
    <main className="min-h-screen bg-[#f5f4ef] text-[#27382f]">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:space-y-5 sm:py-7">
        <LiteJourneyHero
          costaRicaTime={timeIn("America/Costa_Rica")} japanTime={timeIn("Asia/Tokyo")}
          costaRicaDate={dateIn("America/Costa_Rica")} japanDate={dateIn("Asia/Tokyo")}
          now={clockNow} city={day?.city ?? "Japón"} tripDate={selectedDate}
          onPlan={() => setActiveTab("plan")} onExpenses={() => setActiveTab("gastos")}
        />
        <section aria-label="Modo sin conexión" className={online ? "rounded-[22px] border border-[#d9e4d7] bg-[#edf4ec] p-4" : "rounded-[22px] border border-amber-300 bg-amber-50 p-4"} role="status">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={online ? "font-bold text-teal-900" : "font-bold text-amber-900"}>
                {online ? "● Internet disponible" : "● Sin Internet · modo local"}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {online
                  ? "Puedes consultar tus datos guardados aquí. Si se corta Internet mientras Nioli está abierto, podrás seguir usando el itinerario y registrar gastos."
                  : "El itinerario y los gastos ya abiertos siguen disponibles en este teléfono. Los cambios se guardan localmente y se sincronizarán cuando regrese Internet."}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {offlineReady ? "Recursos visuales básicos preparados." : "Recursos visuales sin conexión todavía no confirmados."} Gemini y Google Maps necesitan conexión.
              </p>
            </div>
          </div>
          <button type="button" onClick={downloadOfflineGuide}
            className="mt-3 rounded-xl bg-[#365a45] px-4 py-2.5 text-sm font-semibold text-white">
            Descargar guía de emergencia sin Internet
          </button>
          <p className="mt-2 text-xs text-slate-600">Para reabrir el viaje después de cerrar la pestaña o caducar el PIN necesitas Internet. La guía descargada sí se puede abrir sin conexión.</p>
        </section>
        <nav aria-label="Secciones Nioli Lite" className="sticky top-2 z-20 grid grid-cols-2 gap-2 rounded-2xl border border-[#e1dfd5] bg-white/95 p-2 shadow-sm backdrop-blur">
          <button onClick={() => setActiveTab("plan")} className={activeTab === "plan" ? "rounded-xl bg-[#365a45] px-4 py-3 font-semibold text-white shadow-sm" : "rounded-xl px-4 py-3 font-semibold text-[#476c53]"}>🗺️ Itinerario</button>
          <button onClick={() => setActiveTab("gastos")} className={activeTab === "gastos" ? "rounded-xl bg-[#365a45] px-4 py-3 font-semibold text-white shadow-sm" : "rounded-xl px-4 py-3 font-semibold text-[#476c53]"}>🧾 Facturas y gastos</button>
        </nav>
        {activeTab === "plan" && <>
        <section className={surface}>
          <label htmlFor="day" className="mb-2 block font-semibold">Selecciona el día</label>
          <select id="day" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full rounded-xl border border-slate-300 p-3">
            {days.map((item) => <option key={item.date} value={item.date}>{item.date} · {item.city} · {item.area}</option>)}
          </select>
        </section>
        {day && <section className={surface}>
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e5eee2] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#45694c]">{day.city}</span><span className="rounded-full bg-[#f3ecde] px-3 py-1 text-xs font-semibold text-[#886637]">{day.date}</span></div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#2b4935] sm:text-2xl">{day.area}</h2>
          <p className="mt-1 text-sm text-slate-600">{day.city} · {day.date}</p>
          {day.reservationNote && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Reserva: {day.reservationNote}</p>}
          {day.keyNote && <p className="mt-3 text-sm">{day.keyNote}</p>}
          {day.notes && <p className="mt-2 text-sm text-slate-600">{day.notes}</p>}

          <section aria-label="Navegación Google Maps" className="mt-4 rounded-[20px] border border-[#dbe4e8] bg-[#edf3f4] p-4">
            <h3 className="text-lg font-bold text-blue-950">Cómo llegar · Google Maps</h3>
            <p className="mt-1 text-sm text-blue-900">Abre la ruta en Google Maps para ver trenes, metro y transbordos actualizados.</p>
            {day.transportSummary && <p className="mt-2 rounded-lg bg-white p-3 text-sm text-slate-700">Plan de transporte: {day.transportSummary}</p>}
            {nextStop ? <div className="mt-3 rounded-xl bg-white p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Siguiente parada pendiente</p>
              <p className="mt-1 font-semibold text-slate-950">{nextStop.activity.title}</p>
              <p className="mt-1 text-xs text-slate-600">{nextStop.target.destination?.precision === "verified" ? "Ubicación detallada disponible" : "Destino por nombre: confirma el resultado en Maps"}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { void sendRouteToAndroid(mapsDirectionsUrl(nextStop.target.destination!, "transit"), nextStop.activity.title).then(setMapMessage); }}
                  className="rounded-xl bg-blue-700 px-3 py-3 text-sm font-semibold text-white">🚆 Ruta en Maps</button>
                <a href={androidMapLocationUri(nextStop.target.destination!)}
                  className="rounded-xl border border-blue-300 bg-white px-3 py-3 text-center text-sm font-semibold text-blue-900">📍 Ver destino</a>
              </div>
            </div> : <p className="mt-2 text-sm text-slate-700">No hay una siguiente parada con destino identificable.</p>}
            {mapMessage && <p role="status" className="mt-2 rounded-lg bg-white p-2 text-xs text-blue-900">{mapMessage}</p>}
            <p className="mt-3 text-xs text-blue-950">Para rutas desde tu ubicación, permite el acceso a ubicación en Google Maps. Comprueba las líneas, salidas, transbordos y posibles interrupciones allí antes de viajar. Necesitas Internet para rutas en vivo.</p>
          </section>
          <h3 className="mb-3 mt-5 font-semibold">Actividades ({day.activities.length})</h3>
          <div className="space-y-3">
            {day.activities.map((activity, index) => <article key={activity.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start gap-3">
                <input aria-label={"Completar " + activity.title} type="checkbox" checked={Boolean(activity.completed)} onChange={(event) => updateDay((current) => ({ ...current, activities: current.activities.map((item) => item.id === activity.id ? { ...item, completed: event.target.checked } : item) }))} className="mt-1 h-5 w-5" />
                <div className="min-w-0 flex-1">
                  <p className={activity.completed ? "font-medium line-through opacity-60" : "font-medium"}>{activity.startTime ? activity.startTime + " · " : ""}{activity.title}</p>
                  {activity.notes && <p className="mt-1 text-sm text-slate-600">{activity.notes}</p>}
                  {(() => {
                    const route = activityMapTarget(activity, day.city);
                    if (!route.destination) {
                      const legs = transferLegs(activity, day.city);
                      if (legs.length) return <div className="mt-2 space-y-2 rounded-lg bg-blue-50 p-2">
                        <p className="text-xs font-semibold text-blue-900">Transbordo con varios tramos · consulta cada trayecto en Google Maps</p>
                        {legs.map((leg, legIndex) => <button key={legIndex} type="button"
                          onClick={() => { void sendRouteToAndroid(mapsDirectionsUrl(leg.destination, "transit", leg.origin), leg.label).then(setMapMessage); }}
                          className="block w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-left text-xs font-semibold text-blue-800">
                          🚆 Tramo {legIndex + 1}: {leg.label}
                        </button>)}
                      </div>;
                      return <p className="mt-2 text-xs text-amber-800">Ubicación por confirmar: esta actividad no tiene un destino único. Revisa los detalles del traslado.</p>;
                    }
                    return <div className="mt-3 space-y-2">
                      <p className="text-xs text-slate-500">{route.destination.precision === "verified" ? "Destino con datos de ubicación" : "Destino por búsqueda · comprueba el lugar elegido"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button"
                          onClick={() => { void sendRouteToAndroid(mapsDirectionsUrl(route.destination!, "transit", route.isTransfer ? route.origin : undefined), activity.title).then(setMapMessage); }}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white">🚆 Ruta en Maps</button>
                        <a href={androidMapLocationUri(route.destination!)}
                          className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900">📍 Ver destino</a>
                      </div>
                    </div>;
                  })()}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#658367]">Conversación de viaje</p>
              <h2 className="mt-1 text-lg font-bold text-[#2c5037]">Asistente con Gemini</h2>
            </div>
            {chatMessages.length > 0 && <button type="button" onClick={clearGeminiChat} disabled={aiLoading}
              className="rounded-xl border border-[#dedbd2] px-3 py-2 text-xs font-semibold text-[#5b615a] disabled:opacity-50">Nueva conversación</button>}
          </div>
          <p className="mt-2 text-sm text-slate-600">Gemini recuerda lo conversado en este dispositivo, por separado para cada participante. Puedes continuar una pregunta sin volver a explicarla. No modifica reservas ni el itinerario automáticamente.</p>
          {!chatKey && <p role="status" className="mt-3 rounded-xl bg-[#f3f4eb] p-3 text-sm text-[#49654b]">Recuperando tu conversación…</p>}
          {chatError && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{chatError}</p>}
          {chatMessages.length > 0 && <div aria-label="Historial de conversación" className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto rounded-[20px] border border-[#e3e5db] bg-[#f8f9f4] p-3">
            {chatMessages.map((turn, index) => <div key={index} className={turn.role === "user" ? "ml-7 rounded-2xl rounded-tr-sm bg-[#deeadc] p-3 text-sm text-[#2a4533]" : "mr-7 rounded-2xl rounded-tl-sm border border-[#e6e5dc] bg-white p-3 text-sm text-slate-800"}>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#627764]">{turn.role === "user" ? "Tú" : "Gemini"}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{turn.text}</p>
            </div>)}
          </div>}
          <label htmlFor="lite-gemini-question" className="mt-4 block text-sm font-semibold">¿Qué quieres preguntarle?</label>
          <textarea id="lite-gemini-question" rows={3} value={assistantText} maxLength={700}
            onChange={event => { setAssistantText(event.target.value); setCopied(false); }}
            placeholder="Ej. ¿Y cuánto cuesta eso? ¿Cómo llegamos desde el hotel?"
            className="mt-2 w-full rounded-xl border border-[#c9d8ca] bg-white p-3 outline-none focus:ring-2 focus:ring-[#a1bea4]" />
          <label className="mt-3 flex items-start gap-3 rounded-xl border border-[#d5e1d3] bg-[#f3f8f1] p-3 text-sm text-[#31513d]">
            <input type="checkbox" checked={geminiWebSearch} disabled={aiLoading}
              onChange={event => setGeminiWebSearch(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#365a45]" />
            <span><strong>Buscar en Internet con Google</strong><span className="block text-xs text-[#57715b]">
              Para precios, horarios o información reciente. Desactivado por defecto para ahorrar cuota.
              La búsqueda puede requerir facturación y no confirma disponibilidad en tiempo real.
            </span></span>
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => { void askGemini(); }}
              disabled={aiLoading || !assistantText.trim() || !chatKey}
              className="rounded-xl bg-[#365a45] px-4 py-3 font-semibold text-white disabled:opacity-50">{aiLoading ? "Gemini está respondiendo…" : "Enviar a Gemini"}</button>
            <button type="button" onClick={copyForChatGPT}
              className="rounded-xl border border-[#cddccc] bg-[#eaf1e8] px-4 py-3 font-semibold text-[#385c40]">{copied ? "Copiado" : "Usar en ChatGPT Plus"}</button>
          </div>
          {aiError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{aiError}</p>}
          {geminiSearched && <p role="status" className="mt-3 text-xs font-semibold text-[#456b4c]">Respuesta con búsqueda de Google</p>}
          {geminiSources.length > 0 && <aside aria-label="Fuentes consultadas por Gemini" className="mt-2 rounded-2xl border border-[#dbe3dc] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#57735e]">Fuentes web</p>
            <ul className="mt-2 space-y-2">{geminiSources.map(source => <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer"
                className="break-words text-sm font-medium text-[#285e65] underline underline-offset-2">{source.title}</a>
            </li>)}</ul>
          </aside>}
          {geminiSearchSuggestions && <div className="mt-2">
            <p className="mb-1 text-xs font-semibold text-[#57735e]">Sugerencias de búsqueda de Google</p>
            <iframe title="Sugerencias oficiales de Google Search" srcDoc={geminiSearchSuggestions}
              sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer"
              className="h-20 w-full rounded-lg border border-[#dbe3dc]" />
          </div>}
          <p className="mt-2 text-xs text-slate-500">Historial local por participante. Gemini recibe las últimas intervenciones necesarias para continuar. Evita compartir datos sensibles.</p>
        </section>
        </>}
        {activeTab === "gastos" && <>
          <section className={surface}>
            <div className="mb-4 rounded-[20px] bg-gradient-to-r from-[#41694e] to-[#74947b] p-4 text-white">
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
                <input id="receipt-photo" type="file" accept="image/*,.heic,.heif" capture="environment" onChange={(event) => { void selectReceiptPhoto(event.target.files?.[0] || null); }} className="w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-3 font-normal" />
                {preparingPhoto && <span className="text-xs text-violet-700">Optimizando foto de la cámara…</span>}
                {photoInfo && <span role="status" className="text-xs text-emerald-800">{photoInfo}</span>}
                {recognitionError && !receiptFile && <span role="alert" className="text-xs text-rose-800">{recognitionError}</span>}
              </label>
              {receiptFile && <section className="space-y-2 rounded-xl border border-violet-200 bg-violet-50 p-3">
                <p className="text-sm font-semibold text-violet-900">Leer factura con Gemini</p>
                <p className="text-xs text-violet-800">La imagen solo se envía a Gemini cuando pulsas «Analizar factura». La IA puede equivocarse: comprueba el importe final, la fecha y la moneda antes de guardar.</p>
                <p className="truncate text-xs text-slate-600">{receiptFile.name}</p>
                <button type="button" disabled={recognizing || preparingPhoto} onClick={() => { void recognizeReceipt(); }}
                  className="rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  {recognizing ? "Leyendo factura…" : "Analizar factura y completar datos"}
                </button>
                {recognition && <div role="status" className="rounded-lg bg-white p-3 text-sm">
                  <p className="font-semibold">Confianza: {recognition.confidence === "high" ? "alta" : recognition.confidence === "medium" ? "media" : "baja"}</p>
                  <p>{recognition.total !== null ? "Total detectado: " + recognition.total + " " + (recognition.currency || "moneda desconocida") : "No se pudo detectar el total"}</p>
                  <p>{recognition.date ? "Fecha: " + recognition.date : "Fecha no reconocida"}</p>
                  {recognition.warning && <p className="text-amber-800">{recognition.warning}</p>}
                  <p className="mt-1 font-semibold">Revisa los campos antes de guardar.</p>
                </div>}
                {recognitionError && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{recognitionError}</p>}
              </section>}
              <section className="rounded-xl border border-sky-200 bg-sky-50 p-3" aria-label="Conversión aproximada">
                <p className="text-sm font-semibold text-sky-900">Conversión aproximada</p>
                {receiptEstimate ? <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {(["JPY","CRC","USD"] as const).map(currency => <div key={currency} className="rounded-lg bg-white p-2">
                    <p className="text-xs font-semibold">{currency}</p>
                    <p className="break-all text-sm font-bold text-sky-900">{fmtMoney(receiptEstimate[currency], currency)}</p>
                  </div>)}
                </div> : <p className="mt-1 text-xs">Escribe el monto para ver la conversión cuando exista una tasa disponible.</p>}
                {fxRates && <p className="mt-2 text-xs text-slate-600">Tasa {fxCached ? "guardada" : "consultada en línea"} · {fxRates.asOf || "fecha no disponible"} · {fxRates.source}. Es aproximada y no incluye comisiones ni refleja necesariamente la tasa del día de compra.</p>}
                {fxError && <p className="mt-1 text-xs text-amber-800">{fxError}</p>}
                {!fxRates && <p className="mt-1 text-xs text-amber-800">Sin tasa verificable no se muestran conversiones.</p>}
              </section>
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
                {fxRates && <p className="mt-1 text-xs text-slate-600">Aprox. ₡{fmtMoney(convert(receipt.amount, receipt.currency, "CRC", fxRates), "CRC")} · ${fmtMoney(convert(receipt.amount, receipt.currency, "USD", fxRates), "USD")} · ¥{fmtMoney(convert(receipt.amount, receipt.currency, "JPY", fxRates), "JPY")}</p>}
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
        <LiteCloudSync ready={ready} days={days} receipts={receipts} readPhoto={readReceiptPhoto} storePhoto={storeReceiptPhoto} onRestore={(newDays, newReceipts) => {
          setDays(newDays);
          setReceipts(newReceipts);
          setSelectedDate((date) => newDays.some((day) => day.date === date) ? date : (newDays[0]?.date || ""));
        }} />
        <footer className="pb-5 text-xs text-slate-500">Versión inicial independiente. No modifica la aplicación Nioli principal ni confirma compras o reservas.</footer>
      </div>
    </main>
  );
}
