import type { Activity, ItineraryDay } from "@/types/travel";

type DaySeed = Omit<ItineraryDay, "id" | "dayNumber" | "month">;

const activity = (
  id: string,
  time: string,
  title: string,
  location: string,
  category: Activity["category"],
  estimatedCost = 0,
  note?: string,
): Activity => ({ id, time, title, location, category, estimatedCost, note });

const days: DaySeed[] = [
  {
    date: "2026-11-09", weekday: "Lun", city: "San José", area: "Preparación y salida", weather: "", activities: [
      activity("documents", "08:00", "Revisión de documentos", "San José", "leisure", 0, "Pasaportes, seguros y comprobantes del viaje."),
      activity("sjo-departure", "18:00", "Salida hacia el aeropuerto", "San José → SJO", "transport"),
    ],
  },
  {
    date: "2026-11-10", weekday: "Mar", city: "En ruta", area: "Costa Rica → México", weather: "", activities: [
      activity("flight-cr-mx", "Por definir", "Vuelo Costa Rica → México", "SJO → MEX", "transport", 0, "Horario pendiente de registrar en Reservas."),
      activity("mexico-connection", "Por definir", "Conexión en México", "Aeropuerto de Ciudad de México", "transport"),
    ],
  },
  { date: "2026-11-11", weekday: "Mié", city: "En ruta", area: "México → Narita", weather: "", activities: [activity("flight-mx-jp", "Por definir", "Vuelo a Narita", "MEX → NRT", "transport", 0, "Horario pendiente de registrar en Reservas.")] },
  {
    date: "2026-11-12", weekday: "Jue", city: "Osaka", area: "Llegada a Japón", weather: "", activities: [
      activity("narita-arrival", "Por definir", "Llegada e ingreso a Japón", "Aeropuerto Internacional de Narita", "transport"),
      activity("transfer-osaka", "Por definir", "Traslado a la base de Osaka", "Narita → Osaka", "transport", 0, "Elegir la ruta cuando estén confirmados el vuelo y el alojamiento."),
    ],
  },
  { date: "2026-11-13", weekday: "Vie", city: "Osaka", area: "Namba y Dōtonbori", weather: "", activities: [activity("namba-walk", "10:00", "Primer paseo por Namba", "Namba", "leisure"), activity("dotonbori", "18:00", "Dōtonbori", "Dōtonbori", "food")] },
  { date: "2026-11-14", weekday: "Sáb", city: "Osaka", area: "Castillo y Umeda", weather: "", activities: [activity("osaka-castle", "09:00", "Castillo de Osaka", "Osaka Castle", "culture"), activity("umeda", "17:00", "Atardecer en Umeda", "Umeda", "leisure")] },
  { date: "2026-11-15", weekday: "Dom", city: "Osaka", area: "Universal Studios Japan", weather: "", activities: [activity("usj-day", "08:00", "Universal Studios Japan", "Universal City", "leisure", 0, "Entrada pendiente de registrar en Reservas.")] },
  { date: "2026-11-16", weekday: "Lun", city: "Kyoto", area: "Traslado y centro", weather: "", activities: [activity("osaka-kyoto", "09:00", "Traslado a Kyoto", "Osaka → Kyoto", "transport"), activity("nishiki-intro", "15:00", "Paseo por el centro", "Nishiki y Kawaramachi", "shopping")] },
  {
    date: "2026-11-17", weekday: "Mar", city: "Kyoto", area: "Kyoto Oriental", weather: "", activities: [
      activity("fushimi", "08:00", "Fushimi Inari", "Fushimi Inari Taisha", "culture", 0, "Llegar temprano para un recorrido tranquilo."),
      activity("kiyomizu", "14:30", "Kiyomizu-dera", "Higashiyama", "culture"),
      activity("gion-evening", "18:00", "Atardecer en Gion", "Hanamikoji", "leisure"),
    ],
  },
  { date: "2026-11-18", weekday: "Mié", city: "Kyoto", area: "Arashiyama", weather: "", activities: [activity("bamboo", "07:30", "Bosque de bambú", "Arashiyama Bamboo Grove", "culture"), activity("tenryuji", "10:00", "Templo Tenryū-ji", "Arashiyama", "culture"), activity("katsura", "15:00", "Paseo junto al Katsura", "Ribera de Arashiyama", "leisure")] },
  { date: "2026-11-19", weekday: "Jue", city: "Kyoto", area: "Norte y mercado", weather: "", activities: [activity("kinkakuji", "09:00", "Kinkaku-ji", "Kita Ward", "culture"), activity("nishiki-market", "14:00", "Mercado Nishiki", "Nishikikoji-dori", "food")] },
  { date: "2026-11-20", weekday: "Vie", city: "Kyoto", area: "Gion y Ponto-chō", weather: "", activities: [activity("flex-kyoto", "10:00", "Mañana flexible en Kyoto", "Kyoto", "leisure"), activity("pontocho", "19:00", "Paseo por Ponto-chō", "Nakagyo Ward", "food")] },
  {
    date: "2026-11-21", weekday: "Sáb", city: "Tokio", area: "Traslado a Tokio", weather: "", activities: [
      activity("first-shinkansen-plan", "09:00", "Shinkansen a Tokio", "Kyoto → Tokio", "transport", 0, "Horario y asiento pendientes de registrar en Reservas."),
      activity("tokyo-arrival", "15:00", "Llegada a la base de Tokio", "Tokio", "leisure"),
    ],
  },
  { date: "2026-11-22", weekday: "Dom", city: "Tokio", area: "Shibuya y Harajuku", weather: "", activities: [activity("meiji", "09:00", "Meiji Jingu", "Shibuya", "culture"), activity("harajuku", "12:00", "Harajuku", "Takeshita Street", "shopping"), activity("shibuya", "18:00", "Cruce de Shibuya", "Shibuya", "leisure")] },
  { date: "2026-11-23", weekday: "Lun", city: "Tokio", area: "Akihabara", weather: "", activities: [activity("akihabara-day", "10:00", "Akihabara", "Chiyoda", "shopping"), activity("arcades", "16:00", "Arcades y coleccionables", "Akihabara", "leisure")] },
  { date: "2026-11-24", weekday: "Mar", city: "Tokio", area: "Asakusa y Skytree", weather: "", activities: [activity("sensoji", "08:30", "Sensō-ji", "Asakusa", "culture"), activity("nakamise", "11:00", "Nakamise-dori", "Asakusa", "shopping"), activity("skytree", "17:00", "Tokyo Skytree", "Sumida", "leisure")] },
  { date: "2026-11-25", weekday: "Mié", city: "Tokio", area: "Pokémon y Nintendo", weather: "", activities: [activity("pokemon-center-plan", "10:00", "Pokémon Center", "Tokio", "shopping"), activity("nintendo-store-plan", "14:00", "Nintendo Store", "Tokio", "shopping")] },
  { date: "2026-11-26", weekday: "Jue", city: "Tokio", area: "Tokyo DisneySea", weather: "", activities: [activity("disneysea-day", "08:00", "Tokyo DisneySea", "Urayasu", "leisure", 0, "Entrada pendiente de registrar en Reservas.")] },
  { date: "2026-11-27", weekday: "Vie", city: "Tokio", area: "Odaiba", weather: "", activities: [activity("odaiba", "10:00", "Odaiba", "Tokyo Bay", "leisure"), activity("bay-evening", "18:00", "Noche en la bahía", "Odaiba", "food")] },
  { date: "2026-11-28", weekday: "Sáb", city: "Tokio", area: "Día flexible", weather: "", activities: [activity("tokyo-flex", "10:00", "Día abierto para descubrimientos", "Tokio", "leisure", 0, "Añade aquí lo que descubran durante el viaje.")] },
  { date: "2026-11-29", weekday: "Dom", city: "Tokio", area: "Últimas compras", weather: "", activities: [activity("souvenirs", "10:00", "Recuerdos y compras finales", "Tokio", "shopping"), activity("farewell-dinner", "19:00", "Cena de despedida", "Tokio", "food")] },
  { date: "2026-11-30", weekday: "Lun", city: "En ruta", area: "Tokio → Costa Rica", weather: "", activities: [activity("return-airport", "Por definir", "Traslado al aeropuerto", "Tokio", "transport"), activity("return-flight", "Por definir", "Regreso a Costa Rica", "Japón → Costa Rica", "transport", 0, "Horario pendiente de registrar en Reservas.")] },
];

export const japanItinerary: ItineraryDay[] = days.map((day) => ({
  ...day,
  id: `day-${day.date}`,
  dayNumber: day.date.slice(-2),
  month: "NOV",
}));
