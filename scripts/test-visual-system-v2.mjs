import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (path) => readFileSync(join(root, path), "utf8");

test("mobile navigation is five clear destinations with a More sheet", () => {
  const nav = source("src/components/navigation/bottom-navigation.tsx");
  const css = source("src/app/globals.css");
  for (const label of ["Inicio", "Itinerario", "Mapa", "Passport", "Más"]) assert.match(nav, new RegExp(`>${label}<|label: "${label}"`));
  assert.match(nav, /mobile-more-sheet/);
  assert.match(nav, /Reservas/);
  assert.match(nav, /Finanzas/);
  assert.match(css, /grid-template-columns:\s*repeat\(5/);
  assert.match(css, /min-height:\s*58px/);
});

test("desktop navigation is ordered by trip intent and uses larger icon containers", () => {
  const nav = source("src/components/navigation/side-navigation.tsx");
  const css = source("src/app/globals.css");
  const order = ["Inicio", "Itinerario", "Mapa", "Reservas", "Finanzas", "Nioli Passport"].map((label) => nav.indexOf(`label: "${label}"`));
  assert.ok(order.every((position) => position >= 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.match(nav, />Viajeros</);
  assert.match(css, /\.side-nav-icon\s*\{[^}]*width:\s*38px/s);
  assert.match(css, /\.side-nav-button\s*\{[^}]*font-size:\s*16px/s);
});

test("fake notification bell is removed", () => {
  const top = source("src/components/navigation/top-bar.tsx");
  assert.doesNotMatch(top, /Bell|Notificaciones|notification-button/);
});

test("dashboard hero is a travel ticket with real safe visual assets", () => {
  const dashboard = source("src/features/dashboard/dashboard-view.tsx");
  const app = source("src/features/trips/travel-app.tsx");
  assert.match(dashboard, /NIOLI TRAVEL PASS/);
  assert.match(dashboard, /hero-country-stamp/);
  assert.match(dashboard, /hero-brady/);
  assert.match(app, /experience\.assets\.stamps/);
  assert.match(app, /data-country-id=\{trip\.countryId\}/);
});

test("Japan and Colombia use warm editorial palettes rather than dashboard blocks", () => {
  const countries = source("src/data/countries.ts");
  const css = source("src/app/globals.css");
  assert.match(countries, /id: "japan"[\s\S]*accent: "#B84A43"/);
  assert.match(countries, /id: "colombia"[\s\S]*accent: "#2F5B46"/);
  assert.match(css, /\[data-country-id="japan"\] \.trip-hero/);
  assert.match(css, /\[data-country-id="colombia"\] \.trip-hero/);
});

test("mobile typography has explicit readable floors", () => {
  const css = source("src/app/globals.css");
  assert.match(css, /--nioli-readable:\s*17px/);
  assert.match(css, /\.app-main small\s*\{\s*font-size:\s*13px/);
  assert.match(css, /\.app-main label\s*\{\s*font-size:\s*15px/);
  assert.match(css, /\.app-main :where\(input, select, textarea\)\s*\{\s*font-size:\s*16px/);
});

test("login is alive with Brady while canonical NIOLI logo stays untouched", () => {
  const gate = source("src/features/auth/travel-auth-gate.tsx");
  assert.match(gate, /src="\/brand\/nioli-logo-horizontal\.png"/);
  assert.match(gate, /src="\/nioli\/official\/brady\/master\.png"/);
  assert.match(gate, /auth-route-line/);
  assert.match(gate, /Diferente país, misma esencia/);
});
