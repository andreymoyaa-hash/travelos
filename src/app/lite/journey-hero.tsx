"use client";

import { bradyAssets, countryAssetPacks } from "@/lib/nioli/assets/manifest";
import { getSafeNioliAsset } from "@/lib/nioli/assets/helpers";
import { buildLiteAlerts } from "@/lib/lite-alerts";

const brady = getSafeNioliAsset(bradyAssets.actions.exploring);
const japaneseStamp = getSafeNioliAsset(countryAssetPacks.JP.stamps.items.find(path => path.endsWith("stamp-tokyo.webp")) ?? null);
const alerts = buildLiteAlerts();

type Props = {
  japanTime: string;
  costaRicaTime: string;
  japanDate: string;
  costaRicaDate: string;
  now: number | null;
  city: string;
  tripDate: string;
  onPlan: () => void;
  onExpenses: () => void;
};

export default function LiteJourneyHero({ japanTime, costaRicaTime, japanDate, costaRicaDate, now, city, tripDate, onPlan, onExpenses }: Props) {
  const nextAlert = now === null ? null : alerts.find(item => Date.parse(item.whenUTC) >= now) ?? null;
  const nextTime = nextAlert ? new Intl.DateTimeFormat("es-CR", { timeZone: "Asia/Tokyo", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(nextAlert.whenUTC)) : null;
  return (
    <div className="space-y-3">
      <header className="relative isolate overflow-hidden rounded-[28px] border border-[#e9dfd1] bg-gradient-to-br from-[#fffdf7] via-[#f6f4ec] to-[#eaf0e8] px-5 pb-5 pt-6 shadow-[0_18px_48px_-34px_rgba(42,61,50,0.48)] sm:px-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[42px] border-[#dfe6db]/50" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#53745c] via-[#c49b5b] to-[#6676a0]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#b8ccba] bg-white/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#45654c]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7e9c82]" /> NIOLI · JAPÓN 2026
            </div>
            <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[#263a30] sm:text-4xl">Tu viaje, a tu ritmo<span className="text-[#c59b57]">.</span></h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#647365]">Itinerario, rutas, facturas y tus avisos en un solo lugar.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#d2decf] bg-[#e9f0e6] px-3 py-1.5 text-xs font-semibold text-[#3c6047]">Japón · 11–30 nov</span>
              <span className="rounded-full border border-[#e4d9c5] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#80623b]">{city} · {tripDate}</span>
            </div>
          </div>
          <div className="relative hidden h-44 w-32 shrink-0 items-end justify-center sm:flex">
            {brady ? <img src={brady} alt="Brady, mascota de Nioli, listo para explorar" className="relative z-10 h-44 w-full object-contain object-bottom" loading="eager" /> : null}
            {japaneseStamp ? <img src={japaneseStamp} alt="" aria-hidden="true" className="absolute -right-2 top-0 h-14 w-14 object-contain opacity-70" /> : null}
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onPlan} className="rounded-2xl bg-[#365a45] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#264735] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365a45]">Ver itinerario</button>
          <button type="button" onClick={onExpenses} className="rounded-2xl border border-[#c9d5c7] bg-white/85 px-4 py-3 text-sm font-bold text-[#365a45] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365a45]">Mis gastos</button>
        </div>
      </header>

      <section aria-label="Relojes en tiempo real" className="grid grid-cols-2 gap-3">
        <div className="rounded-[22px] border border-[#e6dfd2] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#706e66]">Costa Rica</p>
          <p className="mt-1.5 text-[clamp(1.3rem,5vw,1.8rem)] font-extrabold tabular-nums tracking-tight text-[#293b33]">{costaRicaTime}</p>
          <p className="mt-1 text-xs capitalize text-[#777a71]">{costaRicaDate}</p>
        </div>
        <div className="rounded-[22px] border border-[#d7dfd1] bg-[#e9efe5] p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#49694d]">Japón · JST</p>
          <p className="mt-1.5 text-[clamp(1.3rem,5vw,1.8rem)] font-extrabold tabular-nums tracking-tight text-[#2c5037]">{japanTime}</p>
          <p className="mt-1 text-xs capitalize text-[#52745d]">{japanDate}</p>
        </div>
      </section>
      <section aria-label="Próximo recordatorio de Nioli" className="flex items-center gap-3 rounded-[22px] border border-[#e9dfcb] bg-[#fffaf0] p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0e4cb] text-xl" aria-hidden="true">◷</div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#896b3c]">Próximo aviso · hora de Japón</p>
          <p className="mt-0.5 text-sm font-bold leading-snug text-[#4f4535]">{nextAlert ? nextAlert.description : "Consulta tus recordatorios del viaje"}</p>
          <p className="mt-1 text-xs text-[#897966]">{nextTime ?? "Google Calendar te enviará los avisos configurados"}</p>
        </div>
      </section>
    </div>
  );
}
