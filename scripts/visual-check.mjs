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

const report = { desktop: {}, responsive: {}, consoleErrors: [], pageErrors: [], responseErrors: [], requestFailures: [] };

const redactSecrets = (value = "") => value
  .replace(/AIza[0-9A-Za-z_-]+/g, "[REDACTED_API_KEY]")
  .replace(/([?&]key=)[^&\s]+/gi, "$1[REDACTED]");

function attachDiagnostics(page) {
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location();
    report.consoleErrors.push({ text: redactSecrets(message.text()), location: { ...location, url: redactSecrets(location.url) } });
  });
  page.on("pageerror", (error) => report.pageErrors.push(redactSecrets(error.message)));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      report.responseErrors.push({ status: response.status(), url: redactSecrets(response.url()) });
    }
  });
  page.on("requestfailed", (request) => {
    report.requestFailures.push({
      url: redactSecrets(request.url()),
      error: redactSecrets(request.failure()?.errorText ?? "Error de red no especificado"),
    });
  });
}

try {
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    permissions: ["geolocation", "camera"],
    geolocation: { latitude: 35.681236, longitude: 139.767125, accuracy: 15 },
  });
  const desktop = await desktopContext.newPage();
  attachDiagnostics(desktop);
  const response = await desktop.goto("http://localhost:3000", { waitUntil: "networkidle" });

  report.desktop.status = response?.status();
  report.desktop.title = await desktop.title();
  report.desktop.bodyCharacters = (await desktop.locator("body").innerText()).trim().length;
  report.desktop.errorOverlay = await desktop.locator("[data-nextjs-dialog]").count();
  report.desktop.dashboardVisible = await desktop.getByRole("heading", { name: "Japón 2026" }).isVisible();
  report.desktop.worldClockVisible = await desktop.getByRole("heading", { name: "Origen y destino, al mismo tiempo" }).isVisible();
  report.desktop.flightCards = await desktop.locator(".flight-card").count();
  report.desktop.internationalDateChange = await desktop.getByLabel("Cambio internacional de fecha").isVisible();
  const dashboardText = await desktop.locator("body").innerText();
  report.desktop.friendlyTimezones = dashboardText.includes("Hora Costa Rica") && dashboardText.includes("Hora Ciudad de México") && dashboardText.includes("Hora Japón")
    && !dashboardText.includes("America/Costa_Rica") && !dashboardText.includes("America/Mexico_City") && !dashboardText.includes("Asia/Tokyo");
  report.desktop.reservationEmpty = await desktop.getByText("No tienes reservas registradas", { exact: true }).isVisible();

  await desktop.getByRole("button", { name: "Cambiar a José" }).click();
  report.desktop.participantSwitch = await desktop.getByRole("heading", { name: /Konnichiwa, José/ }).isVisible();
  await desktop.screenshot({ path: join(artifacts, "travel-os-v1.2-desktop.png"), fullPage: true });

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
  await desktop.screenshot({ path: join(artifacts, "travel-os-v1.2-finances.png"), fullPage: true });

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
  await desktop.locator(".google-map, .google-map-unconfigured").first().waitFor();
  await desktop.waitForTimeout(2500);
  report.desktop.googleMapsFallback = await desktop.getByRole("heading", { name: "Google Maps aún no está configurado." }).isVisible();
  report.desktop.googleMapsConfigHint = report.desktop.googleMapsFallback
    ? await desktop.getByText("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", { exact: true }).isVisible()
    : true;
  report.desktop.googleMapVisible = await desktop.locator(".google-map").isVisible();
  report.desktop.placesAutocompleteVisible = await desktop.locator("gmp-place-autocomplete").isVisible();
  report.desktop.googleMapTechnicalError = await desktop.getByText("Esta página no ha cargado Google Maps correctamente. Descubre los detalles técnicos del problema en la consola de JavaScript.", { exact: true }).isVisible();
  await desktop.getByRole("button", { name: /Usar mi ubicación/ }).first().click();
  const locationCoordinates = desktop.getByText(/35\.681236, 139\.767125/);
  await locationCoordinates.waitFor();
  report.desktop.realLocation = await locationCoordinates.isVisible();

  report.desktop.placeSearches = [];
  report.desktop.destinationRoutes = {};
  if (report.desktop.placesAutocompleteVisible && !report.desktop.googleMapTechnicalError) {
    const placeQueries = ["Fushimi Inari", "Pokémon Center Shibuya", "Tokyo DisneySea"];
    for (const [index, query] of placeQueries.entries()) {
      const autocomplete = desktop.locator("gmp-place-autocomplete");
      const autocompleteBox = await autocomplete.boundingBox();
      if (!autocompleteBox) break;
      await desktop.mouse.click(autocompleteBox.x + autocompleteBox.width / 2, autocompleteBox.y + autocompleteBox.height / 2);
      await desktop.keyboard.press("Control+A");
      await desktop.keyboard.press("Backspace");
      await desktop.keyboard.type(query);
      await desktop.waitForTimeout(2200);
      await desktop.keyboard.press("ArrowDown");
      await desktop.keyboard.press("Enter");
      await desktop.waitForTimeout(2600);
      const destinationText = await desktop.locator(".google-route-planner header > p:last-child").innerText();
      const selected = destinationText !== "Busca y selecciona un destino";
      report.desktop.placeSearches.push({ query, destination: destinationText, selected });
      if (selected) {
        await desktop.getByRole("button", { name: /Más rápido/ }).click();
        await desktop.getByRole("button", { name: "Calcular ruta" }).click();
        const routeResult = desktop.locator(".real-route-result");
        const routeError = desktop.locator(".route-error");
        await routeResult.or(routeError).waitFor({ state: "visible", timeout: 30000 });
        report.desktop.destinationRoutes[query] = await routeResult.isVisible()
          ? { ok: true, text: await routeResult.innerText() }
          : { ok: false, error: await routeError.innerText() };
      }
      if (index < placeQueries.length - 1) {
        await desktop.getByRole("button", { name: "Inicio", exact: true }).click();
        await desktop.getByRole("button", { name: "Mapa", exact: true }).first().click();
        await desktop.locator("gmp-place-autocomplete").waitFor({ state: "visible" });
        await desktop.waitForTimeout(1000);
      }
    }
  }

  report.desktop.savedPlaces = await desktop.locator(".saved-place-list > button").count();
  report.desktop.advancedMarkers = await desktop.locator("gmp-advanced-marker").count();
  report.desktop.googleMapsLink = await desktop.locator(".google-maps-link").getAttribute("href");
  report.desktop.googleMapsLinkValid = Boolean(report.desktop.googleMapsLink?.startsWith("https://www.google.com/maps/dir/?")
    && report.desktop.googleMapsLink.includes("origin=35.681236%2C139.767125")
    && report.desktop.googleMapsLink.includes("destination_place_id="));

  report.desktop.routes = {};
  for (const label of ["Más rápido", "Más barato", "Menos caminata"]) {
    const routeOption = desktop.getByRole("button", { name: new RegExp(label) });
    await routeOption.click();
    const calculate = desktop.getByRole("button", { name: "Calcular ruta" });
    if (await calculate.isDisabled()) {
      report.desktop.routes[label] = { ok: false, error: "Origen o destino no disponible" };
      continue;
    }
    await calculate.click();
    const routeResult = desktop.locator(".real-route-result");
    const routeError = desktop.locator(".route-error");
    await routeResult.or(routeError).waitFor({ state: "visible", timeout: 30000 });
    report.desktop.routes[label] = await routeResult.isVisible()
      ? { ok: true, text: await routeResult.innerText() }
      : { ok: false, error: await routeError.innerText() };
  }
  if (Object.values(report.desktop.routes).every((route) => !route.ok) && report.desktop.googleMapsLink) {
    const routeUrl = new URL(report.desktop.googleMapsLink);
    const [destinationLatitude, destinationLongitude] = (routeUrl.searchParams.get("destination") ?? "").split(",").map(Number);
    report.desktop.routeDiagnostic = await desktop.evaluate(async ({ destinationLatitude, destinationLongitude }) => {
      try {
        const { Route } = await google.maps.importLibrary("routes");
        const summarize = (route) => ({
          duration: route.localizedValues?.duration ?? null,
          durationMillis: route.durationMillis ?? null,
          distance: route.localizedValues?.distance ?? null,
          fare: route.travelAdvisory?.transitFare?.toString() ?? null,
          walkingMeters: route.legs?.reduce((total, leg) => total + leg.steps.reduce((legTotal, step) => legTotal + (step.travelMode === "WALKING" ? step.distanceMeters : 0), 0), 0) ?? null,
        });
        const response = await Route.computeRoutes({
          origin: { lat: 35.681236, lng: 139.767125 },
          destination: { lat: destinationLatitude, lng: destinationLongitude },
          travelMode: "TRANSIT",
          computeAlternativeRoutes: true,
          fields: ["path", "legs", "distanceMeters", "durationMillis", "travelAdvisory", "localizedValues"],
        });
        return { ok: true, routes: response.routes?.map(summarize) ?? [] };
      } catch (error) {
        return {
          ok: false,
          name: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }, { destinationLatitude, destinationLongitude });
  }
  report.desktop.routeSelection = await desktop.getByRole("button", { name: /Menos caminata/ }).getAttribute("aria-pressed") === "true";
  await desktop.screenshot({ path: join(artifacts, "travel-os-v1.2-map.png"), fullPage: true });

  await desktop.getByRole("button", { name: "Travel Passport", exact: true }).click();
  report.desktop.achievementCount = await desktop.locator(".achievement-card").count();
  await desktop.getByRole("button", { name: /Primer Shinkansen/ }).click();
  report.desktop.achievementToggle = await desktop.locator(".achievement-card").filter({ hasText: "Primer Shinkansen" }).getByText("Sello de José", { exact: true }).isVisible();
  await desktop.getByRole("button", { name: "Tomar foto" }).click();
  report.desktop.cameraOpened = await desktop.getByRole("heading", { name: "Tomar foto" }).isVisible();
  await desktop.waitForFunction(() => Array.from(document.querySelectorAll("button")).some((button) => button.textContent?.includes("Capturar") && !button.disabled));
  await desktop.getByRole("button", { name: "Capturar", exact: true }).click();
  await desktop.locator('select').filter({ has: desktop.locator('option[value="first-ramen"]') }).selectOption("first-ramen");
  await desktop.getByRole("button", { name: "Guardar foto" }).click();
  report.desktop.photoSaved = await desktop.locator(".photo-grid article").count() === 1;
  report.desktop.photoAchievement = await desktop.locator(".achievement-card").filter({ hasText: "Primer ramen" }).getByText("Sello de José").isVisible();
  await desktop.screenshot({ path: join(artifacts, "travel-os-v1.2-adventure.png"), fullPage: true });

  for (const width of [320, 375, 390, 430]) {
    const mobileContext = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
    const mobile = await mobileContext.newPage();
    attachDiagnostics(mobile);
    await mobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
    report.responsive[width] = {
      dashboardVisible: await mobile.getByRole("heading", { name: "Japón 2026" }).isVisible(),
      bottomNavigationVisible: await mobile.getByRole("navigation", { name: "Navegación móvil" }).isVisible(),
      horizontalOverflow: await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      viewport: await mobile.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })),
    };
    if (width === 390) await mobile.screenshot({ path: join(artifacts, "travel-os-v1.2-mobile-390.png"), fullPage: true });
    await mobile.getByRole("button", { name: "Mapa", exact: true }).first().click();
    await mobile.locator(".google-map").waitFor({ state: "visible" });
    await mobile.waitForTimeout(1000);
    report.responsive[width].mapVisible = await mobile.locator(".google-map").isVisible();
    report.responsive[width].routePlannerVisible = await mobile.locator(".google-route-planner").isVisible();
    report.responsive[width].mapHorizontalOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (width === 390) await mobile.screenshot({ path: join(artifacts, "travel-os-v1.2-map-mobile-390.png"), fullPage: true });
    await mobileContext.close();
  }
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
  Object.values(report.responsive).some((result) => result.horizontalOverflow || result.mapHorizontalOverflow || !result.dashboardVisible || !result.bottomNavigationVisible || !result.mapVisible || !result.routePlannerVisible) ||
  report.consoleErrors.length > 0 ||
  report.pageErrors.length > 0 ||
  report.responseErrors.some((error) => error.url.startsWith("http://localhost:3000")) ||
  !report.desktop.dashboardVisible ||
  !report.desktop.worldClockVisible ||
  report.desktop.flightCards !== 2 ||
  !report.desktop.internationalDateChange ||
  !report.desktop.friendlyTimezones ||
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
  (!report.desktop.googleMapsFallback && (!report.desktop.googleMapVisible || report.desktop.googleMapTechnicalError)) ||
  (report.desktop.googleMapsFallback && !report.desktop.googleMapsConfigHint) ||
  (!report.desktop.googleMapsFallback && report.desktop.placeSearches.some((place) => !place.selected)) ||
  (!report.desktop.googleMapsFallback && Object.values(report.desktop.destinationRoutes).some((route) => !route.ok)) ||
  (!report.desktop.googleMapsFallback && report.desktop.savedPlaces < 3) ||
  (!report.desktop.googleMapsFallback && report.desktop.advancedMarkers < 4) ||
  (!report.desktop.googleMapsFallback && !report.desktop.googleMapsLinkValid) ||
  (!report.desktop.googleMapsFallback && Object.values(report.desktop.routes).some((route) => !route.ok)) ||
  !report.desktop.realLocation ||
  !report.desktop.routeSelection ||
  !report.desktop.achievementToggle ||
  !report.desktop.cameraOpened ||
  !report.desktop.photoSaved ||
  !report.desktop.photoAchievement;

if (failed) process.exitCode = 1;
