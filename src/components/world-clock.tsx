"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Globe2, Moon, Sun } from "lucide-react";

import type { WorldClockConfig, WorldClockLocation } from "@/types/travel";

interface WorldClockProps {
  config: WorldClockConfig;
  startDate: string;
  endDate: string;
}

const timeFormatter = (timeZone: string) => new Intl.DateTimeFormat("es-CR", {
  timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateFormatter = (timeZone: string) => new Intl.DateTimeFormat("es-CR", {
  timeZone,
  weekday: "short",
  day: "2-digit",
  month: "short",
});

const getZonedParts = (date: Date, timeZone: string) => Object.fromEntries(
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]),
) as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;

const getOffsetMinutes = (date: Date, timeZone: string) => {
  const part = getZonedParts(date, timeZone);
  const zonedTimestamp = Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute, part.second);
  return Math.round((zonedTimestamp - date.getTime()) / 60000);
};

const getDateKey = (date: Date, timeZone: string) => {
  const part = getZonedParts(date, timeZone);
  return `${part.year}-${String(part.month).padStart(2, "0")}-${String(part.day).padStart(2, "0")}`;
};

function ClockLocation({ location, now, priority }: { location: WorldClockLocation; now: Date; priority: boolean }) {
  const parts = getZonedParts(now, location.timeZone);
  const DaylightIcon = parts.hour >= 7 && parts.hour < 19 ? Sun : Moon;

  return (
    <div className={priority ? "world-clock-location priority" : "world-clock-location"}>
      <span className="world-clock-country" aria-hidden="true">{location.countryCode}</span>
      <div>
        <small>{priority ? "Hora principal" : "Hora de referencia"}</small>
        <strong>{location.city}</strong>
        <time dateTime={now.toISOString()}>{timeFormatter(location.timeZone).format(now)}</time>
        <span>{dateFormatter(location.timeZone).format(now).replaceAll(".", "").toUpperCase()}</span>
      </div>
      <DaylightIcon size={20} aria-label={parts.hour >= 7 && parts.hour < 19 ? "Horario diurno" : "Horario nocturno"} />
    </div>
  );
}

export function WorldClock({ config, startDate, endDate }: WorldClockProps) {
  const [now, setNow] = useState<Date>();

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const clockState = useMemo(() => {
    if (!now) return { destinationPriority: false, difference: "—" };
    const destinationDate = getDateKey(now, config.destination.timeZone);
    const destinationPriority = destinationDate >= startDate && destinationDate <= endDate;
    const differenceMinutes = getOffsetMinutes(now, config.destination.timeZone) - getOffsetMinutes(now, config.origin.timeZone);
    const sign = differenceMinutes >= 0 ? "+" : "−";
    const absoluteMinutes = Math.abs(differenceMinutes);
    const hours = Math.floor(absoluteMinutes / 60);
    const minutes = absoluteMinutes % 60;
    return {
      destinationPriority,
      difference: `${sign}${hours}${minutes ? ` h ${minutes} min` : " h"}`,
    };
  }, [config, endDate, now, startDate]);

  return (
    <article className="world-clock-card surface-card" aria-live="polite">
      <header>
        <div><p className="eyebrow"><Globe2 size={15} aria-hidden="true" /> Reloj mundial</p><h2>Origen y destino, al mismo tiempo</h2></div>
        <span><Clock3 size={15} aria-hidden="true" /> {clockState.difference}</span>
      </header>
      {now ? (
        <div className="world-clock-grid">
          <ClockLocation location={config.origin} now={now} priority={!clockState.destinationPriority} />
          <div className="clock-connection" aria-hidden="true"><i /><span>{clockState.difference}</span><i /></div>
          <ClockLocation location={config.destination} now={now} priority={clockState.destinationPriority} />
        </div>
      ) : <div className="clock-skeleton">Sincronizando horas locales…</div>}
    </article>
  );
}
