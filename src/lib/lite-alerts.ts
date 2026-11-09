import { japan2026Trip } from "@/data/trips/japan-2026";

export const TOKYO_ZONE = "Asia/Tokyo";
export type LiteAlert = {
  id: string;
  date: string;
  time: string;
  description: string;
  kind: "morning" | "reservation" | "flight";
  advanceMinutes: number;
  whenUTC: string;
};

function tokyoToUTC(date: string, time: string, advanceMinutes = 0) {
  // Japan does not observe daylight saving time: JST = UTC+09:00.
  const parsed = Date.parse(date + "T" + time + ":00+09:00");
  if (!Number.isFinite(parsed)) throw new Error("Invalid alert date");
  return new Date(parsed - advanceMinutes * 60_000).toISOString();
}

function alert(id: string, date: string, time: string, description: string,
  kind: LiteAlert["kind"], advanceMinutes: number): LiteAlert {
  return { id: id + "-" + advanceMinutes, date, time, description, kind, advanceMinutes,
    whenUTC: tokyoToUTC(date, time, advanceMinutes) };
}
function addDays(date: string, count: number) {
  const ms = Date.parse(date + "T00:00:00Z") + count * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function buildLiteAlerts(): LiteAlert[] {
  const alerts: LiteAlert[] = [];
  // Confirmed daily digest; itinerary changes must not silently move fixed reservations.
  for (let i = 0; i < 20; i++) {
    const day = addDays("2026-11-11", i);
    const entry = japan2026Trip.itinerary.find(d => d.date === day);
    if (entry) alerts.push(alert("morning-" + day, day, "07:00",
      "Plan de hoy en " + entry.city + ": " + entry.area, "morning", 0));
  }
  const confirmed = [
    // Flight times below are expressed in Japan time to keep a single timezone.
    // AM0691 departs SJO 2026-11-09 13:21 Costa Rica = JST 2026-11-10 04:21.
    { id: "am0691", date: "2026-11-10", time: "04:21", title: "Aeroméxico AM0691 · salida de San José 13:21 (Costa Rica)", offsets: [180, 60] },
    // AM0058 departs MEX 2026-11-09 21:45 Mexico City = JST 2026-11-10 12:45.
    { id: "am0058", date: "2026-11-10", time: "12:45", title: "Aeroméxico AM0058 · salida de Ciudad de México 21:45 (México)", offsets: [180, 60] },
    { id: "gk215", date: "2026-11-11", time: "11:50", title: "Jetstar GK215 · Narita T3 → Kansai T1", offsets: [180, 60] },
    { id: "usj-mario", date: "2026-11-12", time: "11:30", title: "USJ · Mario Kart", offsets: [60, 30] },
    { id: "usj-yoshi", date: "2026-11-12", time: "12:00", title: "USJ · Yoshi's Adventure", offsets: [60, 30] },
    { id: "pokepark", date: "2026-11-26", time: "14:00", title: "Pokémon Forest · ventana 14:00–15:00", offsets: [60, 30] },
    { id: "return-am0057", date: "2026-11-30", time: "09:35", title: "Aeroméxico AM0057 · Narita T1", offsets: [180, 60] },
    // AM0656 leaves MEX 2026-11-30 19:05 Mexico City = JST 2026-12-01 10:05.
    { id: "am0656", date: "2026-12-01", time: "10:05", title: "Aeroméxico AM0656 · salida de Ciudad de México 19:05 (México)", offsets: [180, 60] },
  ];
  for (const event of confirmed) for (const offset of event.offsets)
    alerts.push(alert(event.id, event.date, event.time, event.title,
      event.id.startsWith("am") || event.id.includes("gk") ? "flight" : "reservation", offset));
  // DisneySea ticket purchase is not confirmed: NEVER create a paid-entry reminder.
  return alerts.sort((a, b) => a.whenUTC.localeCompare(b.whenUTC));
}
