import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright-core";

const root = process.cwd();
const artifacts = join(root, "artifacts");
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});

const report = { checks: {}, maps: {}, mobile: {}, consoleErrors: [], pageErrors: [], responseErrors: [], requestFailures: [], notes: [] };
const redact = (value = "") => value.replace(/AIza[0-9A-Za-z_-]+/g, "[REDACTED_API_KEY]").replace(/([?&]key=)[^&\s]+/gi, "$1[REDACTED]");
const check = (name, value, detail) => { report.checks[name] = { ok: Boolean(value), ...(detail === undefined ? {} : { detail }) }; return Boolean(value); };

function diagnostics(page) {
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push(redact(message.text()));
  });
  page.on("pageerror", (error) => report.pageErrors.push(redact(error.message)));
  page.on("response", (response) => {
    if (response.status() >= 400) report.responseErrors.push({ status: response.status(), url: redact(response.url()) });
  });
  page.on("requestfailed", (request) => report.requestFailures.push({ url: redact(request.url()), error: redact(request.failure()?.errorText ?? "Unknown") }));
}

async function storedTrips(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("travel-os:trips:v2") ?? '{"trips":[]}').trips);
}

async function openFeature(page, name) {
  await page.getByRole("button", { name, exact: true }).first().click();
  await page.waitForTimeout(150);
}

async function captureReview(page, { note, save = true, retake = false } = {}) {
  const capture = page.getByRole("button", { name: "Capturar", exact: true });
  await capture.waitFor({ state: "visible" });
  await page.waitForFunction(() => Array.from(document.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Capturar" && !button.disabled));
  await capture.click();
  await page.getByRole("heading", { name: "Revisar fotografía" }).waitFor();
  if (retake) {
    await page.getByRole("button", { name: "Volver a tomar" }).click();
    await page.getByRole("heading", { name: "Tomar foto" }).waitFor();
    const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=", "base64");
    await page.locator('.camera-modal input[type="file"]').setInputFiles({ name: "travel-os-retake.png", mimeType: "image/png", buffer: onePixelPng });
    await page.getByRole("heading", { name: "Revisar fotografía" }).waitFor();
  }
  if (note) await page.getByLabel("Nota").fill(note);
  if (save) await page.getByRole("button", { name: "Guardar recuerdo" }).click();
  else await page.getByRole("button", { name: "Cerrar cámara" }).click();
}

async function uploadReview(page, { note, save = true } = {}) {
  const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=", "base64");
  await page.locator('.camera-modal input[type="file"]').setInputFiles({ name: "travel-os-qa.png", mimeType: "image/png", buffer: onePixelPng });
  await page.getByRole("heading", { name: "Revisar fotografía" }).waitFor();
  if (note) await page.getByLabel("Nota").fill(note);
  if (save) await page.getByRole("button", { name: "Guardar recuerdo" }).click();
  else await page.getByRole("button", { name: "Cerrar cámara" }).click();
}

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["geolocation", "camera"],
    geolocation: { latitude: 35.681236, longitude: 139.767125, accuracy: 15 },
  });
  const page = await context.newPage();
  diagnostics(page);
  const response = await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  check("page_loads", response?.status() === 200, response?.status());
  check("meaningful_content", (await page.locator("body").innerText()).length > 500);
  check("no_next_error_overlay", await page.locator("[data-nextjs-dialog]").count() === 0);
  check("japan_dashboard", await page.getByRole("heading", { name: "Japón 2026" }).isVisible());
  check("japan_world_clock", await page.locator(".world-clock-location").count() === 2);
  check("japan_flight_cards", await page.locator(".flight-card").count() === 2);

  let trips = await storedTrips(page);
  let japan = trips.find((trip) => trip.id === "japan-2026");
  const japanSnapshot = {
    days: japan.itinerary.length,
    activities: japan.itinerary.reduce((sum, day) => sum + day.activities.length, 0),
    bases: japan.bases.map((base) => `${base.id}:${base.status}`),
    flights: japan.flightSegments.map((flight) => flight.id),
    participants: japan.participants.map((participant) => participant.name),
    stamps: japan.achievements.length,
    reservations: japan.reservations.length,
    expenses: japan.expenses.length,
    photos: japan.photos.length,
    osakaAddress: japan.bases.find((base) => base.id === "osaka")?.location.address,
  };
  check("japan_snapshot_initial", japanSnapshot.days === 22 && japanSnapshot.activities === 143 && japanSnapshot.stamps === 17 && japanSnapshot.flights.length === 2 && japanSnapshot.participants.join("|") === "Andy|José" && japanSnapshot.osakaAddress?.includes("3-chōme-11-9 Motomachi"), japanSnapshot);

  await openFeature(page, "Itinerario");
  check("japan_22_day_cards", await page.locator(".date-chip").count() === 22);
  check("japan_unique_day_ids", await page.locator(".date-chip").evaluateAll((nodes) => new Set(nodes.map((node) => node.textContent)).size) === 22);
  await openFeature(page, "Travel Passport");
  check("japan_17_stamps", await page.locator(".passport-stamp-card").count() === 17);
  check("japan_companion_profile", await page.getByRole("heading", { name: "Pikachu" }).isVisible());
  await page.screenshot({ path: join(artifacts, "travel-os-v1.2-adventure.png"), fullPage: true });

  await page.locator(".country-trigger").click();
  await page.getByRole("heading", { name: "Mis viajes" }).waitFor();
  await page.getByRole("button", { name: "Compartir Japón 2026" }).click();
  check("sharing_is_honest", await page.getByText("Compartir entre dispositivos requiere configurar Cloud Sync.", { exact: true }).isVisible());
  await page.getByRole("button", { name: "Entendido" }).click();

  await page.getByRole("button", { name: "Crear viaje" }).click();
  await page.getByLabel("Nombre del viaje").fill("México QA");
  await page.getByLabel("País").selectOption("mexico");
  await page.getByLabel("Ciudad inicial (opcional)").fill("Ciudad de México");
  await page.getByLabel("Fecha inicio").fill("2027-01-10");
  await page.getByLabel("Fecha final").fill("2027-01-20");
  await page.getByLabel("Moneda principal").selectOption("MXN");
  await page.getByLabel("Zona horaria de destino").fill("America/Mexico_City");
  await page.getByLabel(/Participantes/).fill("Andy, Ana");
  await page.getByLabel("Nombre del usuario creador").fill("Andy");
  await page.getByRole("button", { name: "Crear viaje", exact: true }).last().click();
  await page.getByRole("heading", { name: "México QA" }).waitFor();

  trips = await storedTrips(page);
  let mexico = trips.find((trip) => trip.name === "México QA");
  check("mexico_created_stable_id", mexico?.id?.startsWith("trip-") && mexico.id !== "japan-2026", mexico?.id);
  check("mexico_starts_independent", mexico.itinerary.length === 0 && mexico.expenses.length === 0 && mexico.reservations.length === 0 && mexico.photos.length === 0 && !mexico.achievements.some((stamp) => stamp.id.startsWith("jp-") || stamp.id === "fushimi-inari"));
  check("mexico_theme", await page.locator(".travel-shell").getAttribute("data-country-style") === "mexico");
  const mexicoDashboard = await page.locator("body").innerText();
  check("mexico_has_no_japan_dashboard_copy", !mexicoDashboard.includes("Konnichiwa") && !mexicoDashboard.includes("Costa Rica → México → Japón") && !mexicoDashboard.includes("Tres bases, mil historias"));
  check("mexico_generic_companion", mexico.settings.companionProfileId === "travel-os");

  await openFeature(page, "Itinerario");
  check("mexico_empty_itinerary_ui", await page.getByText("Todavía no hay días planificados", { exact: true }).isVisible());
  await page.getByRole("button", { name: "Agregar primer día" }).click();
  await page.getByLabel("Fecha").fill("2027-01-10");
  await page.getByLabel("Ciudad").fill("Ciudad de México");
  await page.getByLabel("Área o plan").fill("Centro histórico");
  await page.getByRole("button", { name: "Guardar día" }).click();
  await page.getByRole("button", { name: "Nueva actividad" }).click();
  await page.getByLabel("Actividad", { exact: true }).fill("Museo QA");
  await page.getByLabel("Lugar", { exact: true }).fill("Centro Histórico");
  await page.getByLabel("Costo estimado").fill("250");
  check("activity_currency_uses_trip", await page.getByLabel("Moneda").inputValue() === "MXN");
  await page.getByRole("button", { name: "Añadir al itinerario" }).click();
  check("mexico_activity_created", await page.getByText("Museo QA", { exact: true }).isVisible());
  await page.getByRole("button", { name: "Editar Museo QA" }).click();
  await page.getByLabel("Actividad", { exact: true }).fill("Museo QA editado");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  check("mexico_activity_edited", await page.getByText("Museo QA editado", { exact: true }).isVisible());

  await page.getByRole("button", { name: "Añadir día" }).click();
  await page.getByLabel("Fecha").fill("2027-01-11");
  await page.getByLabel("Ciudad").fill("Ciudad de México");
  await page.getByLabel("Área o plan").fill("Roma Norte");
  await page.getByRole("button", { name: "Guardar día" }).click();
  await page.locator(".date-chip").filter({ hasText: "Centro histórico" }).click();
  await page.getByRole("button", { name: "Mover Museo QA editado" }).click();
  await page.locator('select[name="targetDayId"]').selectOption({ index: 1 });
  await page.getByRole("button", { name: "Mover actividad", exact: true }).click();
  await page.locator(".date-chip").filter({ hasText: "Roma Norte" }).click();
  check("mexico_activity_moved", await page.getByText("Museo QA editado", { exact: true }).isVisible());
  await page.getByRole("button", { name: "Mover plan" }).click();
  await page.locator('select[name="targetDayId"]').selectOption({ index: 1 });
  await page.getByRole("button", { name: "Intercambiar plan" }).click();
  await page.locator(".date-chip").filter({ hasText: "Roma Norte" }).click();
  check("mexico_day_plan_moved", await page.getByText("Museo QA editado", { exact: true }).isVisible());

  await openFeature(page, "Finanzas");
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await page.getByLabel("Descripción").fill("Tacos QA");
  await page.getByLabel("Monto").fill("320");
  await page.locator('select[name="currency"]').selectOption("MXN");
  await page.getByRole("button", { name: "Guardar gasto" }).click();
  check("mexico_expense_created", await page.getByText("Tacos QA", { exact: true }).isVisible());

  await openFeature(page, "Reservas");
  await page.getByRole("button", { name: "Añadir reserva" }).click();
  await page.getByLabel("Tipo").selectOption("other");
  await page.getByLabel("Proveedor").fill("Proveedor QA");
  await page.getByLabel("Nombre de la reserva").fill("Reserva QA");
  await page.getByLabel("Fecha").fill("2027-01-12");
  await page.getByLabel("Hora").fill("10:30");
  await page.getByRole("button", { name: "Guardar reserva" }).click();
  check("mexico_other_reservation_created", await page.getByRole("heading", { name: "Reserva QA" }).isVisible());

  await page.locator(".country-trigger").click();
  await page.getByRole("button", { name: "Editar México QA" }).click();
  await page.getByLabel(/Participantes/).fill("Andy, Ana, Bea");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await page.getByRole("button", { name: "Continuar viaje" }).click();
  check("mexico_participant_added", await page.getByRole("button", { name: "Cambiar a Bea" }).isVisible());

  await page.evaluate(() => window.scrollTo({ top: 420, behavior: "instant" }));
  await page.waitForTimeout(100);
  const dashboardScroll = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "Tomar foto desde dashboard" }).click();
  check("camera_opens_from_dashboard", await page.getByRole("heading", { name: "Tomar foto" }).isVisible());
  await captureReview(page, { save: false, retake: true });
  check("camera_retake", true);
  check("camera_close_preserves_dashboard", await page.getByRole("heading", { name: "México QA" }).isVisible());
  const dashboardScrollAfter = await page.evaluate(() => window.scrollY);
  check("camera_close_preserves_scroll", Math.abs(dashboardScrollAfter - dashboardScroll) < 3, { before: dashboardScroll, after: dashboardScrollAfter });

  await openFeature(page, "Itinerario");
  await page.getByRole("button", { name: "Foto", exact: true }).click();
  check("camera_opens_from_itinerary", await page.getByRole("heading", { name: "Tomar foto" }).isVisible());
  await uploadReview(page, { note: "Recuerdo QA" });
  check("camera_returns_to_itinerary", await page.getByText("Museo QA editado", { exact: true }).isVisible());

  await openFeature(page, "Travel Passport");
  check("mexico_has_no_japan_stamps", await page.getByText("Fushimi Inari", { exact: true }).count() === 0 && await page.getByText("Primer Shinkansen", { exact: true }).count() === 0);
  check("mexico_generic_companion_ui", await page.getByRole("heading", { name: "Compañero Travel OS" }).isVisible());
  await page.getByRole("button", { name: "Sello personalizado" }).click();
  await page.getByLabel("Nombre").fill("Recuerdo especial QA");
  await page.getByLabel("Ciudad o región").fill("Ciudad de México");
  await page.getByLabel("Descripción").fill("Sello temporal de verificación");
  await page.getByRole("button", { name: "Crear sello bloqueado" }).click();
  check("custom_stamp_created", await page.getByRole("button", { name: /Recuerdo especial QA/ }).isVisible());
  await page.getByRole("button", { name: /Recuerdo especial QA/ }).click();
  await page.getByRole("button", { name: "Cámara" }).click();
  await uploadReview(page, { note: "Foto del sello QA" });
  check("camera_returns_to_stamp", await page.getByRole("heading", { name: "Recuerdo especial QA" }).isVisible());
  check("photo_unlocks_stamp", await page.getByText("Desbloqueado por Andy", { exact: true }).isVisible());
  await page.getByRole("button", { name: "Cerrar" }).click();
  check("companion_reacts_to_stamp", await page.getByText("¡Nuevo sello conseguido!", { exact: true }).isVisible());
  check("passport_photo_visible", await page.locator(".photo-grid figure").count() >= 2);
  await page.getByRole("button", { name: /Explorar un barrio/ }).click();
  await page.getByRole("button", { name: "Validar manualmente" }).click();
  check("manual_unlock_and_xp", await page.getByText("Desbloqueado por Andy", { exact: true }).isVisible());
  await page.getByRole("button", { name: "Cerrar" }).click();
  check("xp_progressed", Number((await page.locator(".companion-xp strong").innerText()).trim()) >= 70);
  await page.screenshot({ path: join(artifacts, "travel-os-v1.2-adventure.png"), fullPage: true });

  await openFeature(page, "Itinerario");
  await page.getByRole("button", { name: "Eliminar Museo QA editado" }).click();
  await page.getByRole("button", { name: "Eliminar actividad" }).click();
  check("mexico_activity_deleted", await page.getByText("Museo QA editado", { exact: true }).count() === 0);

  await page.locator(".country-trigger").click();
  await page.locator(".trip-manager-card").filter({ hasText: "Japón 2026" }).getByRole("button", { name: /Abrir viaje|Continuar viaje/ }).click();
  await page.getByRole("heading", { name: "Japón 2026" }).waitFor();
  trips = await storedTrips(page);
  japan = trips.find((trip) => trip.id === "japan-2026");
  const afterJapan = { days: japan.itinerary.length, activities: japan.itinerary.reduce((sum, day) => sum + day.activities.length, 0), bases: japan.bases.length, flights: japan.flightSegments.length, stamps: japan.achievements.length, participants: japan.participants.map((p) => p.name).join("|") };
  check("japan_snapshot_after_mexico", afterJapan.days === 22 && afterJapan.activities === 143 && afterJapan.bases === 3 && afterJapan.flights === 2 && afterJapan.stamps === 17 && afterJapan.participants === "Andy|José", afterJapan);

  await openFeature(page, "Mapa");
  await page.locator(".google-map, .google-map-unconfigured").first().waitFor();
  const mapsFallback = await page.getByRole("heading", { name: "Google Maps aún no está configurado." }).isVisible().catch(() => false);
  report.maps.configured = !mapsFallback;
  if (!mapsFallback) {
    await page.locator(".google-map").waitFor({ state: "visible" });
    await page.waitForTimeout(1800);
    report.maps.canvas = await page.locator(".google-map .gm-style").count() > 0;
    report.maps.technicalError = await page.getByText(/Esta página no ha cargado Google Maps correctamente/).count() > 0;
    await page.getByRole("button", { name: /Usar mi ubicación/ }).first().click();
    await page.getByText(/35\.68124, 139\.76713|35\.681236, 139\.767125/).first().waitFor();
    report.maps.gps = true;

    report.maps.api = await page.evaluate(async () => {
      const queries = ["Fushimi Inari", "Pokémon Center Shibuya", "Tokyo DisneySea"];
      const { Place } = await google.maps.importLibrary("places");
      const places = [];
      for (const textQuery of queries) {
        const result = await Place.searchByText({ textQuery, fields: ["id", "displayName", "formattedAddress", "location"] });
        const place = result.places?.[0];
        places.push({ query: textQuery, id: place?.id ?? null, name: place?.displayName ?? null, address: place?.formattedAddress ?? null, lat: place?.location?.lat() ?? null, lng: place?.location?.lng() ?? null });
      }
      const { Route } = await google.maps.importLibrary("routes");
      const routeResults = [];
      for (const place of places) {
        if (place.lat === null || place.lng === null) { routeResults.push({ query: place.query, ok: false }); continue; }
        const baseRequest = { origin: "Tokyo Station, Tokyo, Japan", destination: { lat: place.lat, lng: place.lng }, travelMode: "TRANSIT", departureTime: new Date(Date.now() + 86400000), computeAlternativeRoutes: true, fields: ["path", "legs", "distanceMeters", "durationMillis", "travelAdvisory", "localizedValues"] };
        const fastestResponse = await Route.computeRoutes(baseRequest);
        const walkingResponse = await Route.computeRoutes({ ...baseRequest, transitPreference: { routingPreference: "LESS_WALKING" } });
        const routes = fastestResponse.routes ?? [];
        const fares = routes.map((route) => route.travelAdvisory?.transitFare).filter(Boolean);
        routeResults.push({ query: place.query, ok: routes.length > 0, duration: routes[0]?.localizedValues?.duration ?? null, distance: routes[0]?.localizedValues?.distance ?? null, fare: routes[0]?.travelAdvisory?.transitFare?.toString() ?? null, cheapestComparable: fares.length > 1, cheapestMessage: fares.length > 1 ? null : "No hay suficientes datos de tarifa para comparar estas rutas.", lessWalkingRoutes: walkingResponse.routes?.length ?? 0 });
      }
      const controlResponse = await Route.computeRoutes({ origin: "Hunters Point San Francisco, CA 94124", destination: "201 Marine Dr, San Francisco, CA 94129", travelMode: "TRANSIT", departureTime: new Date(Date.now() + 86400000), fields: ["path", "legs", "distanceMeters", "durationMillis", "travelAdvisory", "localizedValues"] });
      const controlRoute = controlResponse.routes?.[0];
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      const host = document.createElement("div"); host.style.cssText = "width:160px;height:120px;position:fixed;left:-1000px"; document.body.append(host);
      const map = new Map(host, { center: { lat: 35.681236, lng: 139.767125 }, zoom: 12, mapId: "DEMO_MAP_ID" });
      const marker = new AdvancedMarkerElement({ map, position: { lat: 35.681236, lng: 139.767125 }, title: "QA Advanced Marker" });
      const advancedMarker = Boolean(marker.map);
      marker.map = null; host.remove();
      return { places, routeResults, advancedMarker, control: { ok: Boolean(controlRoute), duration: controlRoute?.localizedValues?.duration ?? null, distance: controlRoute?.localizedValues?.distance ?? null, fare: controlRoute?.travelAdvisory?.transitFare?.toString() ?? null } };
    });
    report.maps.places = report.maps.api.places.every((place) => place.id && place.name && place.lat !== null);
    report.maps.routes = report.maps.api.routeResults.every((route) => route.ok && route.duration && route.distance && route.lessWalkingRoutes > 0);
    report.maps.routeFieldMask = report.maps.api.control.ok && report.maps.api.control.duration && report.maps.api.control.distance;
    report.maps.faresHonest = report.maps.api.routeResults.every((route) => route.fare || route.cheapestMessage === "No hay suficientes datos de tarifa para comparar estas rutas.");
    report.maps.advancedMarkers = report.maps.api.advancedMarker;

    const disneySea = report.maps.api.places.find((place) => place.query === "Tokyo DisneySea");
    await page.evaluate((place) => {
      const envelope = JSON.parse(localStorage.getItem("travel-os:trips:v2"));
      const japan = envelope.trips.find((trip) => trip.id === "japan-2026");
      japan.savedPlaces = [...japan.savedPlaces, { id: "qa-disneysea", tripId: japan.id, name: "Tokyo DisneySea QA", address: place.address, latitude: place.lat, longitude: place.lng, placeId: place.id }];
      localStorage.setItem("travel-os:trips:v2", JSON.stringify(envelope));
    }, disneySea);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(350);
    await openFeature(page, "Mapa");
    await page.locator(".google-map").waitFor({ state: "visible" });
    await page.getByRole("button", { name: /Usar mi ubicación/ }).first().click();
    await page.locator(".saved-place-list > button").filter({ hasText: "Tokyo DisneySea QA" }).click();
    report.maps.uiDestination = true;
    const link = page.locator(".google-maps-link");
    report.maps.openInGoogleMaps = (await link.count()) > 0 && (await link.getAttribute("href"))?.startsWith("https://www.google.com/maps/dir/");
    report.maps.options = {};
    for (const label of ["Más rápido", "Más barato", "Menos caminata"]) {
      await page.getByRole("button", { name: new RegExp(label) }).click();
      await page.getByRole("button", { name: "Calcular ruta" }).click();
      const result = page.locator(".real-route-result");
      const error = page.locator(".route-error");
      await result.or(error).waitFor({ state: "visible", timeout: 30000 });
      report.maps.options[label] = await result.isVisible() ? await result.innerText() : await error.innerText();
    }

    const input = page.locator("gmp-place-autocomplete input");
    if (await input.count()) {
      await input.fill("Tokyo DisneySea");
      await page.waitForTimeout(2200);
      await input.press("ArrowDown");
      await input.press("Enter");
      await page.waitForTimeout(1800);
      report.maps.autocompleteUi = !(await page.locator(".google-route-planner header > p:last-child").innerText()).includes("Busca y selecciona");
    } else report.notes.push("El input interno de Places no fue accesible en el shadow DOM; la API real sí se validó directamente.");
    await page.screenshot({ path: join(artifacts, "travel-os-v1.2-map.png"), fullPage: true });
  }
  check("maps_render", mapsFallback ? false : report.maps.canvas && !report.maps.technicalError);
  check("places_real_results", mapsFallback ? false : report.maps.places, report.maps.api?.places);
  check("routes_real_results", mapsFallback ? false : report.maps.routes, report.maps.api?.routeResults);
  check("routes_field_mask_valid", mapsFallback ? false : report.maps.routeFieldMask, report.maps.api?.control);
  check("gps_explicit", mapsFallback ? false : report.maps.gps);
  check("advanced_markers", mapsFallback ? false : report.maps.advancedMarkers);
  check("fare_handling_honest", mapsFallback ? false : report.maps.faresHonest);
  check("open_in_google_maps", mapsFallback ? false : report.maps.openInGoogleMaps);
  check("route_options_ui", mapsFallback ? false : Object.keys(report.maps.options ?? {}).length === 3, report.maps.options);

  await page.locator(".country-trigger").click();
  await page.locator(".trip-manager-card").filter({ hasText: "México QA" }).getByRole("button", { name: /Abrir viaje|Continuar viaje/ }).click();
  trips = await storedTrips(page);
  mexico = trips.find((trip) => trip.name === "México QA");
  check("mexico_persisted_after_switch", mexico.expenses.length === 1 && mexico.reservations.length === 1 && mexico.photos.length === 2 && mexico.participants.length === 3 && mexico.achievements.some((stamp) => stamp.title === "Recuerdo especial QA" && stamp.unlockedBy.length === 1));
  await page.locator(".country-trigger").click();
  await page.getByRole("button", { name: "Eliminar México QA" }).click();
  await page.getByLabel("Confirmación").fill("ELIMINAR");
  await page.getByRole("button", { name: "Eliminar viaje" }).click();
  trips = await storedTrips(page);
  check("qa_trip_removed", trips.length === 1 && trips[0].id === "japan-2026");
  check("japan_delete_protected", await page.getByRole("button", { name: "Japón 2026 está protegido" }).isDisabled());
  await page.screenshot({ path: join(artifacts, "travel-os-v1.2-desktop.png"), fullPage: true });
  await context.close();

  for (const width of [320, 375, 390, 430]) {
    const mobileContext = await browser.newContext({ viewport: { width, height: 844 }, permissions: ["camera", "geolocation"], geolocation: { latitude: 35.681236, longitude: 139.767125, accuracy: 15 } });
    const mobile = await mobileContext.newPage();
    diagnostics(mobile);
    await mobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await mobile.waitForTimeout(250);
    const result = {
      dashboard: await mobile.getByRole("heading", { name: "Japón 2026" }).isVisible(),
      nav: await mobile.getByRole("navigation", { name: "Navegación móvil" }).isVisible(),
      overflow: await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      bodyFont: await mobile.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize)),
      minTouch: await mobile.evaluate(() => Math.min(...Array.from(document.querySelectorAll(".bottom-navigation button, .country-trigger, .traveler-stack button")).map((element) => element.getBoundingClientRect().height))),
    };
    if (width === 390) {
      await mobile.getByRole("button", { name: "Passport", exact: true }).click();
      result.passport = await mobile.locator(".passport-cover").isVisible();
      result.passportOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      await mobile.getByRole("button", { name: "Tomar foto" }).click();
      await mobile.waitForTimeout(300);
      result.cameraBounds = await mobile.locator(".camera-modal").evaluate((element) => ({ height: element.getBoundingClientRect().height, viewport: window.innerHeight, top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom }));
      result.cameraFullscreen = Math.abs(result.cameraBounds.height - result.cameraBounds.viewport) < 3 && Math.abs(result.cameraBounds.top) < 3;
      await mobile.getByRole("button", { name: "Cerrar cámara" }).click();
      await openFeature(mobile, "Mapa");
      await mobile.locator(".google-map, .google-map-unconfigured").first().waitFor();
      result.map = await mobile.locator(".google-map").isVisible();
      result.mapOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      await mobile.screenshot({ path: join(artifacts, "travel-os-v1.2-mobile-390.png"), fullPage: true });
    }
    report.mobile[width] = result;
    await mobileContext.close();
  }
  check("mobile_320_375_390_430", Object.values(report.mobile).every((result) => result.dashboard && result.nav && !result.overflow && result.bodyFont >= 16 && result.minTouch >= 43));
  check("mobile_passport_camera_map", report.mobile[390].passport && !report.mobile[390].passportOverflow && report.mobile[390].cameraFullscreen && report.mobile[390].map && !report.mobile[390].mapOverflow);
} catch (error) {
  report.fatal = redact(error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : String(error));
} finally {
  await browser.close();
}

const unique = (values) => Array.from(new Set(values.map((value) => JSON.stringify(value)))).map((value) => JSON.parse(value));
report.consoleErrors = unique(report.consoleErrors);
report.pageErrors = unique(report.pageErrors);
report.responseErrors = unique(report.responseErrors);
report.requestFailures = unique(report.requestFailures);
check("no_console_errors", report.consoleErrors.length === 0, report.consoleErrors);
check("no_page_errors", report.pageErrors.length === 0, report.pageErrors);
check("no_local_network_errors", !report.responseErrors.some((error) => error.url.startsWith("http://localhost:3000")), report.responseErrors);

console.log(JSON.stringify(report, null, 2));
if (report.fatal || Object.values(report.checks).some((result) => !result.ok)) process.exitCode = 1;
