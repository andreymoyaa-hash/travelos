import type { Activity, TripLocation } from "@/types/travel";

export type LiteTransport = "transit" | "walking";

export type LiteMapDestination = {
  label: string;
  query: string;
  placeId?: string;
  precision: "verified" | "search";
};

// Deliberately do not infer a single destination from vague itinerary tasks.
const VAGUE = /^(?:descanso|tiempo libre|compra mínima|compras libres|traslado al aeropuerto correspondiente|check-in\s*$|check-out\s*$|express flexible|almuerzo libre|cena cerca|comida libre|paseo libre|explorar|tiempo flexible|regreso libre)/i;

function safeLocation(location: TripLocation | undefined, fallback: string, city: string): LiteMapDestination | null {
  const title = (location?.name || fallback || "").trim();
  if (!title || VAGUE.test(title)) return null;
  const address = location?.address?.trim();
  const lat = location?.latitude, lng = location?.longitude;
  if (typeof lat === "number" && typeof lng === "number" &&
      Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { label: title, query: lat + "," + lng, precision: "verified" };
  }
  if (address) return { label: title, query: address + ", Japan", placeId: location?.placeId || undefined, precision: "verified" };
  if (location?.placeId) return { label: title, query: title + ", " + city + ", Japan", placeId: location.placeId, precision: "verified" };
  // An itinerary title is a SEARCH hint, not verified coordinates.
  return { label: title, query: title + ", " + city + ", Japan", precision: "search" };
}

const KNOWN_TERMINALS: Record<string, string> = {
  "KIX T1": "Kansai International Airport Terminal 1, Osaka, Japan",
  "Namba": "Namba Station, Osaka, Japan",
  "Namba/Motomachi": "Motomachi Namba, Osaka, Japan",
  "Osaka-Namba": "Osaka-Namba Station, Osaka, Japan",
  "Universal City": "Universal-City Station, Osaka, Japan",
  "Kintetsu-Nara": "Kintetsu-Nara Station, Nara, Japan",
  "Kyoto Station": "Kyoto Station, Kyoto, Japan",
  "Enmachi": "Enmachi Station, Kyoto, Japan",
  "Kioto": "Kyoto Station, Kyoto, Japan",
  "Tokio": "Tokyo Station, Tokyo, Japan",
  "Shiinamachi": "Shiinamachi Station, Tokyo, Japan",
  "Maihama / DisneySea": "Tokyo DisneySea, Urayasu, Chiba, Japan",
  "Yomiuriland": "Yomiuriland, Inagi, Tokyo, Japan",
  "Odaiba": "Odaiba, Tokyo, Japan",
};
function terminal(value: string, city: string): LiteMapDestination | null {
  const key = value.trim().replace(/\s*·.*$/, "").trim();
  const exact = KNOWN_TERMINALS[key];
  if (exact) return { label: key, query: exact, precision: "search" };
  if (!key || VAGUE.test(key)) return null;
  // Unknown compound route endpoints are intentionally not converted into guessed stops.
  if (key.includes("/") || key.includes("→")) return null;
  return { label: key, query: key + ", " + city + ", Japan", precision: "search" };
}
export function activityMapTarget(activity: Activity, city: string): { destination: LiteMapDestination | null; origin: LiteMapDestination | null; isTransfer: boolean } {
  // The itinerary often stores transport titles as "origin → destination" while
  // location.name is the whole route (not a point Google Maps could geocode).
  if (activity.category === "transport" || activity.categories?.includes("transport")) {
    const title = activity.title;
    const sections = title.split(/\s*→\s*/).map(v => v.trim()).filter(Boolean);
    if (sections.length === 2) {
      return { origin: terminal(sections[0], city), destination: terminal(sections[1], city), isTransfer: true };
    }
    // Multiple legs require explicit stop-by-stop review; never guess a single destination.
    if (sections.length > 2) return { origin: null, destination: null, isTransfer: true };
  }
  return { destination: safeLocation(activity.location, activity.title, activity.city || city), origin: null, isTransfer: false };
}

export function transferLegs(activity: Activity, city: string) {
  if (activity.category !== "transport" && !activity.categories?.includes("transport")) return [];
  const sections = activity.title.split(/\s*→\s*/).map(v => v.trim()).filter(Boolean);
  if (sections.length < 3) return [];
  const stops = sections.map(name => terminal(name, city));
  return stops.slice(1).flatMap((destination, i) =>
    stops[i] && destination ? [{ origin: stops[i]!, destination, label: sections[i] + " → " + sections[i + 1] }] : []);
}

export function mapsDirectionsUrl(destination: LiteMapDestination, mode: LiteTransport, origin?: LiteMapDestination | null) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", destination.query);
  if (destination.placeId) url.searchParams.set("destination_place_id", destination.placeId);
  if (origin) {
    url.searchParams.set("origin", origin.query);
    if (origin.placeId) url.searchParams.set("origin_place_id", origin.placeId);
  }
  url.searchParams.set("travelmode", mode);
  // Directions display can offer multiple transit alternatives and real departure schedules.
  // Do not force driving navigation for rail or promise navigation for transit mode.
  return url.toString();
}

export function mapsSearchUrl(destination: LiteMapDestination) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", destination.query);
  if (destination.placeId) url.searchParams.set("query_place_id", destination.placeId);
  return url.toString();
}


/**
 * Google Maps app deep link. Android Chrome supports intent:// links with an
 * explicit Maps package and a browser fallback URL. On iOS the Google Maps
 * custom scheme can open the installed app. Desktop/unknown: universal URL.
 *
 * Use this only from a direct user gesture. Never send rail trips to
 * google.navigation: (it cannot select public transit).
 */
export function nativeGoogleMapsUrl(webUrl: string, userAgent: string): string {
  let parsed: URL;
  try {
    parsed = new URL(webUrl);
    if (parsed.protocol !== "https:" || parsed.hostname !== "www.google.com" ||
        !parsed.pathname.startsWith("/maps/")) return webUrl;
  } catch { return webUrl; }

  if (/android/i.test(userAgent)) {
    // Chrome intent keeps the full transit/route query intact while targeting
    // com.google.android.apps.maps. Fallback covers browsers without the app.
    return "intent://" + parsed.host + parsed.pathname + parsed.search +
      "#Intent;scheme=https;package=com.google.android.apps.maps;" +
      "S.browser_fallback_url=" + encodeURIComponent(webUrl) + ";end";
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    const query = parsed.searchParams;
    if (parsed.pathname.startsWith("/maps/dir/")) {
      const destination = query.get("destination");
      if (!destination) return webUrl;
      const ios = new URL("comgooglemaps://");
      ios.searchParams.set("daddr", destination);
      const origin = query.get("origin");
      if (origin) ios.searchParams.set("saddr", origin);
      ios.searchParams.set("directionsmode", query.get("travelmode") || "transit");
      return ios.toString();
    }
    if (parsed.pathname.startsWith("/maps/search/")) {
      const destination = query.get("query");
      if (!destination) return webUrl;
      const ios = new URL("comgooglemaps://");
      ios.searchParams.set("q", destination);
      return ios.toString();
    }
  }
  return webUrl;
}
