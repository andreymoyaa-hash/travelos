import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright-core";

const root = process.cwd();
const artifacts = join(root, "artifacts");
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

const report = { desktop: {}, mobile: {}, consoleErrors: [], pageErrors: [], responseErrors: [], requestFailures: 0, externalMapErrors: 0 };

function attachDiagnostics(page) {
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (message.location().url.startsWith("https://tile.openstreetmap.org/")) {
      report.externalMapErrors += 1;
      return;
    }
    report.consoleErrors.push({ text: message.text(), location: message.location() });
  });
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      report.responseErrors.push({ status: response.status(), url: response.url() });
    }
  });
  page.on("requestfailed", () => { report.requestFailures += 1; });
}

try {
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    permissions: ["geolocation", "camera"],
    geolocation: { latitude: 9.9281, longitude: -84.0907, accuracy: 15 },
  });
  const desktop = await desktopContext.newPage();
  attachDiagnostics(desktop);
  const response = await desktop.goto("http://localhost:3000", { waitUntil: "networkidle" });

  report.desktop.status = response?.status();
  report.desktop.title = await desktop.title();
  report.desktop.bodyCharacters = (await desktop.locator("body").innerText()).trim().length;
  report.desktop.errorOverlay = await desktop.locator("[data-nextjs-dialog]").count();
  report.desktop.dashboardVisible = await desktop.getByRole("heading", { name: "Japón 2026" }).isVisible();
  report.desktop.reservationEmpty = await desktop.getByText("No tienes reservas registradas", { exact: true }).isVisible();

  await desktop.getByRole("button", { name: "Cambiar a José" }).click();
  report.desktop.participantSwitch = await desktop.getByRole("heading", { name: /Konnichiwa, José/ }).isVisible();
  await desktop.screenshot({ path: join(artifacts, "travel-os-v1.1-desktop.png"), fullPage: true });

  await desktop.getByRole("button", { name: "Itinerario", exact: true }).click();
  report.desktop.itineraryDays = await desktop.locator(".date-chip").count();
  report.desktop.fullDateRange = await desktop.getByRole("button", { name: /Lun 30 NOV/ }).isVisible();
  await desktop.getByRole("button", { name: /Mié 11 NOV/ }).click();
  report.desktop.masterArrival = await desktop.getByText("Llegada a Narita Terminal 1", { exact: true }).isVisible();
  report.desktop.osakaBase = await desktop.locator(".accommodation-card").filter({ hasText: "Motomachi / Namba" }).getByText("Confirmado", { exact: true }).isVisible();
  await desktop.getByRole("button", { name: /Dom 15 NOV/ }).click();
  report.desktop.pendingKyotoBase = await desktop.locator(".accommodation-card").filter({ hasText: "Kyoto" }).getByText("Pendiente de agregar", { exact: true }).isVisible();
  await desktop.screenshot({ path: join(artifacts, "travel-os-japan-2026-itinerary.png"), fullPage: true });
  await desktop.getByRole("button", { name: /Lun 09 NOV/ }).click();
  await desktop.getByRole("button", { name: "Nueva actividad" }).click();
  await desktop.getByRole("textbox", { name: "Actividad", exact: true }).fill("Nintendo Museum");
  await desktop.getByLabel("Lugar").fill("Uji, Kyoto");
  await desktop.getByRole("button", { name: "Añadir al itinerario" }).click();
  report.desktop.activityCreated = await desktop.getByText("Nintendo Museum", { exact: true }).isVisible();

  await desktop.getByRole("button", { name: "Finanzas", exact: true }).click();
  report.desktop.expenseEmpty = await desktop.getByText("No tienes gastos registrados", { exact: true }).isVisible();
  await desktop.getByRole("button", { name: "Registrar gasto" }).click();
  await desktop.getByLabel("Descripción").fill("Ramen de verificación");
  await desktop.getByLabel("Monto").fill("18.50");
  await desktop.locator('select[name="currency"]').selectOption("USD");
  await desktop.locator('select[name="paidBy"]').selectOption("jose");
  await desktop.getByRole("button", { name: "Guardar gasto" }).click();
  report.desktop.expenseCreated = await desktop.getByText("Ramen de verificación", { exact: true }).isVisible();
  report.desktop.multicurrency = await desktop.locator(".expense-amount").filter({ hasText: /18[,.]50/ }).isVisible();
  await desktop.screenshot({ path: join(artifacts, "travel-os-v1.1-finances.png"), fullPage: true });

  await desktop.getByRole("button", { name: "Reservas", exact: true }).first().click();
  await desktop.getByRole("button", { name: "Añadir reserva" }).click();
  await desktop.locator('select[name="type"]').selectOption("ticket");
  await desktop.getByLabel("Proveedor").fill("Shibuya Sky");
  await desktop.getByLabel("Nombre de la reserva").fill("Entrada Shibuya Sky");
  await desktop.getByLabel("Código").fill("SKY-2026");
  await desktop.getByLabel("Fecha").fill("2026-11-24");
  await desktop.getByLabel("Hora").fill("17:00");
  await desktop.getByRole("button", { name: "Guardar reserva" }).click();
  report.desktop.reservationCreated = await desktop.getByRole("heading", { name: "Entrada Shibuya Sky" }).isVisible();

  await desktop.getByRole("button", { name: "Itinerario", exact: true }).first().click();
  await desktop.getByRole("button", { name: /Mar 24 NOV/ }).click();
  await desktop.getByRole("button", { name: "Editar Shibuya Sky al atardecer" }).click();
  const shibuyaReservationId = await desktop.locator('select[name="reservationId"] option').filter({ hasText: "Entrada Shibuya Sky" }).getAttribute("value");
  await desktop.locator('select[name="reservationId"]').selectOption(shibuyaReservationId);
  await desktop.getByRole("button", { name: "Guardar cambios" }).click();
  await desktop.getByRole("button", { name: "Mover Shibuya Sky al atardecer" }).click();
  report.desktop.linkedReservationWarning = await desktop.getByText("Este día contiene reservas vinculadas.", { exact: true }).isVisible();
  await desktop.locator('select[name="targetDayId"]').selectOption("jp-2026-day-2026-11-23");
  await desktop.getByRole("button", { name: "Mover actividad", exact: true }).click();
  await desktop.getByRole("button", { name: /Lun 23 NOV/ }).click();
  report.desktop.activityMoved = await desktop.getByText("Shibuya Sky al atardecer", { exact: true }).isVisible();
  await desktop.getByRole("button", { name: "Reservas", exact: true }).first().click();
  const movedReservationCard = desktop.locator(".reservation-card").filter({ hasText: "Entrada Shibuya Sky" });
  report.desktop.reservationCardText = await movedReservationCard.innerText();
  report.desktop.linkedReservationMoved = await movedReservationCard.locator(".reservation-date strong").getByText("23", { exact: true }).isVisible()
    && await movedReservationCard.locator(".reservation-date span").getByText("NOV", { exact: true }).isVisible();

  await desktop.getByRole("button", { name: "Mapa", exact: true }).first().click();
  await desktop.locator(".leaflet-container").waitFor();
  report.desktop.leafletVisible = await desktop.locator(".leaflet-container").isVisible();
  await desktop.getByRole("button", { name: /Usar mi ubicación/ }).first().click();
  report.desktop.realLocation = await desktop.getByText(/9\.928100, -84\.090700/).isVisible();
  await desktop.waitForTimeout(6500);
  report.desktop.loadedMapTiles = await desktop.locator(".leaflet-tile-loaded").count();
  report.desktop.mapBaseHandled = report.desktop.loadedMapTiles > 0 || await desktop.getByText(/No se pudo descargar el mapa base/).isVisible();
  await desktop.getByRole("button", { name: /Más barato/ }).click();
  report.desktop.routeSelection = await desktop.getByText("Más barato", { exact: true }).last().isVisible();
  await desktop.screenshot({ path: join(artifacts, "travel-os-v1.1-map.png"), fullPage: true });

  await desktop.getByRole("button", { name: /^Aventura/ }).click();
  report.desktop.achievementCount = await desktop.locator(".achievement-card").count();
  await desktop.getByRole("button", { name: /Primer Shinkansen/ }).click();
  report.desktop.achievementToggle = await desktop.getByText("Sello de José", { exact: true }).isVisible();
  await desktop.getByRole("button", { name: "Tomar foto" }).click();
  report.desktop.cameraOpened = await desktop.getByRole("heading", { name: "Tomar foto" }).isVisible();
  await desktop.waitForFunction(() => Array.from(document.querySelectorAll("button")).some((button) => button.textContent?.includes("Capturar") && !button.disabled));
  await desktop.getByRole("button", { name: "Capturar", exact: true }).click();
  await desktop.locator('select').filter({ has: desktop.locator('option[value="first-ramen"]') }).selectOption("first-ramen");
  await desktop.getByRole("button", { name: "Guardar foto" }).click();
  report.desktop.photoSaved = await desktop.locator(".photo-grid article").count() === 1;
  report.desktop.photoAchievement = await desktop.locator(".achievement-card").filter({ hasText: "Primer ramen" }).getByText("Sello de José").isVisible();
  await desktop.screenshot({ path: join(artifacts, "travel-os-v1.1-adventure.png"), fullPage: true });

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const mobile = await mobileContext.newPage();
  attachDiagnostics(mobile);
  await mobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
  report.mobile.dashboardVisible = await mobile.getByRole("heading", { name: "Japón 2026" }).isVisible();
  report.mobile.bottomNavigationVisible = await mobile.getByRole("navigation", { name: "Navegación móvil" }).isVisible();
  report.mobile.horizontalOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  report.mobile.viewport = await mobile.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  await mobile.screenshot({ path: join(artifacts, "travel-os-v1.1-mobile.png"), fullPage: true });
} finally {
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));

const failed =
  report.desktop.status !== 200 ||
  report.desktop.bodyCharacters < 500 ||
  report.desktop.errorOverlay > 0 ||
  report.desktop.itineraryDays !== 22 ||
  report.desktop.achievementCount !== 17 ||
  report.mobile.horizontalOverflow ||
  report.consoleErrors.length > 0 ||
  report.pageErrors.length > 0 ||
  report.responseErrors.some((error) => error.url.startsWith("http://localhost:3000")) ||
  !report.desktop.dashboardVisible ||
  !report.desktop.reservationEmpty ||
  !report.desktop.participantSwitch ||
  !report.desktop.fullDateRange ||
  !report.desktop.masterArrival ||
  !report.desktop.osakaBase ||
  !report.desktop.pendingKyotoBase ||
  !report.desktop.activityCreated ||
  !report.desktop.expenseEmpty ||
  !report.desktop.expenseCreated ||
  !report.desktop.multicurrency ||
  !report.desktop.reservationCreated ||
  !report.desktop.linkedReservationWarning ||
  !report.desktop.activityMoved ||
  !report.desktop.linkedReservationMoved ||
  !report.desktop.leafletVisible ||
  !report.desktop.realLocation ||
  !report.desktop.mapBaseHandled ||
  !report.desktop.routeSelection ||
  !report.desktop.achievementToggle ||
  !report.desktop.cameraOpened ||
  !report.desktop.photoSaved ||
  !report.desktop.photoAchievement ||
  !report.mobile.dashboardVisible ||
  !report.mobile.bottomNavigationVisible;

if (failed) process.exitCode = 1;
