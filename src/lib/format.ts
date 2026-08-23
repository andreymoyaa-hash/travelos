import type { Currency } from "@/types/travel";

export function formatMoney(value: number, currency: Currency): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(value);
}

export function formatYen(value: number): string {
  return formatMoney(value, "JPY");
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
