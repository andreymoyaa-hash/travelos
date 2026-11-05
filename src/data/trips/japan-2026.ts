import { japanAchievements } from "@/data/japan-achievements";
import { assertTripTemplate } from "@/data/trips/validate-trip";
import { assertJapan2026Baseline } from "@/data/trips/japan-2026-baseline";
import type { Trip, TripDay } from "@/types/travel";

const itinerary: TripDay[] = [
  {
    "id": "jp-2026-day-2026-11-11",
    "date": "2026-11-11",
    "weekday": "Mié",
    "dayNumber": "11",
    "month": "NOV",
    "city": "Osaka",
    "area": "Llegada a Osaka · KIX → Namba · descanso",
    "dayType": "recovery",
    "baseId": "osaka",
    "notes": "Día de llegada y descanso real. Vuelo Jetstar Japan GK215 Narita T3 11:50 → Kansai T1 13:30. Después sólo traslado, check-in, cena cerca y compra mínima si hace falta.",
    "transportSummary": "NRT T3 11:50 → KIX T1 13:30 (GK215) → Namba/Motomachi. Sin Shinkansen este día.",
    "foodPause": "Comprar desayuno, agua y snacks en supermercado para evitar depender de aeropuerto o konbini.",
    "keyNote": "No planear atracciones ni Dotonbori este día; prioridad total al descanso antes de USJ.",
    "paceNote": "Ritmo suave. Dotonbori se hace el viernes 13 con Namba/Den Den Town.",
    "activities": [
      {
        "id": "jp-2026-11-11-transfer",
        "title": "KIX T1 → Namba/Motomachi",
        "date": "2026-11-11",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "KIX T1 → Namba/Motomachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka",
        "notes": "Vuelo confirmado: GK215 llega a KIX T1 a las 13:30. Traslado terrestre a Namba después de salir de terminal."
      },
      {
        "id": "jp-2026-11-11-checkin",
        "title": "Check-in en Kinna · Motomachi",
        "date": "2026-11-11",
        "category": "travel",
        "categories": [
          "travel"
        ],
        "location": {
          "name": "Check-in en Kinna · Motomachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "startTime": "15:00",
        "city": "Osaka",
        "notes": "Check-in después de las 15:00.",
        "reservationId": "osaka-stay-2026"
      },
      {
        "id": "jp-2026-11-11-supplies",
        "title": "Compra mínima cerca del alojamiento · agua/desayuno",
        "date": "2026-11-11",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Compra mínima cerca del alojamiento · agua/desayuno",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-11-dotonbori",
        "title": "Descanso en el alojamiento / cena cerca",
        "date": "2026-11-11",
        "category": "leisure",
        "categories": [
          "leisure",
          "food",
          "photography"
        ],
        "location": {
          "name": "Descanso en el alojamiento / cena cerca",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka",
        "optional": true
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-12",
    "date": "2026-11-12",
    "weekday": "Jue",
    "dayNumber": "12",
    "month": "NOV",
    "city": "Osaka",
    "area": "Universal Studios Japan · CONFIRMADO",
    "dayType": "theme-park",
    "baseId": "osaka",
    "notes": "USJ confirmado para el jueves 12. Express Pass: SUPER NINTENDO WORLD 11:30–12:30; Mario Kart 11:30–12:00; Yoshi 12:00–12:30. Hollywood Dream, Minion Mayhem y Flying Dinosaur quedan flexibles. Comprobar compras elegibles para reembolso tax-free bajo las reglas vigentes desde 1 nov 2026: conservar recibos y mercancía para revisión al salir, no asumir descuento inmediato.",
    "transportSummary": "Salir temprano desde Namba hacia Universal City; confirmar transbordos el mismo día.",
    "reservationNote": "CONFIRMADO · respetar las ventanas impresas del Express Pass.",
    "keyNote": "SUPER NINTENDO WORLD está garantizado por el Express Pass de 11:30 a 12:30. Llegar a la zona con margen.",
    "paceNote": "Mine Cart Madness no está en este Express: intentar standby después de Yoshi o cuando la cola baje.",
    "activities": [
      {
        "id": "jp-2026-11-12-usj-transfer",
        "title": "Namba → Universal City",
        "date": "2026-11-12",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Namba → Universal City",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-12-usj",
        "title": "Universal Studios Japan",
        "date": "2026-11-12",
        "category": "theme-park",
        "categories": [
          "theme-park"
        ],
        "location": {
          "name": "Universal Studios Japan",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka",
        "reservationId": "usj-2026-11-12",
        "stampId": "jp-osaka-universal-studios"
      },
      {
        "id": "jp-2026-11-12-mario-kart",
        "title": "Mario Kart: Koopa's Challenge™",
        "date": "2026-11-12",
        "category": "theme-park",
        "categories": [
          "theme-park",
          "gaming"
        ],
        "location": {
          "name": "Mario Kart: Koopa's Challenge™",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "startTime": "11:30",
        "endTime": "12:00",
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-12-donkey-kong",
        "title": "Yoshi's Adventure™",
        "date": "2026-11-12",
        "category": "theme-park",
        "categories": [
          "theme-park",
          "gaming"
        ],
        "location": {
          "name": "Yoshi's Adventure™",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "startTime": "12:00",
        "endTime": "12:30",
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-12-harry-potter",
        "title": "Express flexible · Hollywood Dream + Minion Mayhem + Flying Dinosaur",
        "date": "2026-11-12",
        "category": "theme-park",
        "categories": [
          "theme-park"
        ],
        "location": {
          "name": "Express flexible · Hollywood Dream + Minion Mayhem + Flying Dinosaur",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka",
        "notes": "Una vez cada atracción con espera reducida; hacerlas alrededor del bloque fijo de Nintendo World."
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-13",
    "date": "2026-11-13",
    "weekday": "Vie",
    "dayNumber": "13",
    "month": "NOV",
    "city": "Osaka",
    "area": "Namba, Nipponbashi y segunda mano",
    "dayType": "standard",
    "baseId": "osaka",
    "notes": "Namba Yasaka Shrine gratis temprano; Den Den Town; Shinsekai/Tsutenkaku exterior; Dotonbori de noche. Takoyaki, rueda Ebisu ¥1.000 y crucero Tombori ¥2.000 por persona son opciones, no paradas obligatorias.",
    "foodPause": "Comer fuera del eje turístico de Dotonbori cuando sea posible.",
    "keyNote": "Fotografiar precios antes de comprar; comprobar estado y compatibilidad regional de electrónica y juegos.",
    "paceNote": "Comparar figuras, manga, videojuegos, cartas y souvenirs antes de decidir.",
    "activities": [
      {
        "id": "jp-2026-11-13-bookoff",
        "title": "BOOKOFF PLUS Namba Ebisubashi",
        "date": "2026-11-13",
        "category": "shopping",
        "categories": [
          "shopping",
          "geek"
        ],
        "location": {
          "name": "BOOKOFF PLUS Namba Ebisubashi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-13-daiso",
        "title": "DAISO Namba",
        "date": "2026-11-13",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "DAISO Namba",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-13-denden",
        "title": "Ota Road / Den Den Town",
        "date": "2026-11-13",
        "category": "geek",
        "categories": [
          "geek",
          "shopping",
          "anime",
          "gaming"
        ],
        "location": {
          "name": "Ota Road / Den Den Town",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-13-surugaya",
        "title": "Surugaya Nipponbashi",
        "date": "2026-11-13",
        "category": "shopping",
        "categories": [
          "shopping",
          "geek"
        ],
        "location": {
          "name": "Surugaya Nipponbashi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-13-mandarake",
        "title": "Mandarake Grand Chaos",
        "date": "2026-11-13",
        "category": "shopping",
        "categories": [
          "shopping",
          "geek"
        ],
        "location": {
          "name": "Mandarake Grand Chaos",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-13-dotonbori",
        "title": "Dotonbori",
        "date": "2026-11-13",
        "category": "food",
        "categories": [
          "food",
          "shopping",
          "photography"
        ],
        "location": {
          "name": "Dotonbori",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-14",
    "date": "2026-11-14",
    "weekday": "Sáb",
    "dayNumber": "14",
    "month": "NOV",
    "city": "Osaka",
    "area": "Katsuo-ji y Umeda",
    "dayType": "standard",
    "baseId": "osaka",
    "notes": "Katsuo-ji temprano; tarde en Osaka Station, Toki-no-Hiroba y Umeda.",
    "transportSummary": "Minoh-Kayano → Katsuo-ji. El bus directo de sábado comienza a las 09:00; revisar horario operativo la noche anterior.",
    "reservationNote": "WEB TICKET RECOMENDADO para Katsuo-ji · no obligatorio; ayuda a evitar la fila de taquilla en otoño.",
    "keyNote": "Umeda Sky es opcional si bastan las vistas gratuitas.",
    "paceNote": "Referencia del documento: Katsuo-ji ¥500 y Umeda Sky ¥2.000; confirmar antes de pagar.",
    "activities": [
      {
        "id": "jp-2026-11-14-katsuoji",
        "title": "Katsuo-ji",
        "date": "2026-11-14",
        "category": "temple",
        "categories": [
          "temple"
        ],
        "location": {
          "name": "Katsuo-ji",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Minoh",
        "estimatedCost": 500,
        "currency": "JPY",
        "stampId": "jp-osaka-katsuoji"
      },
      {
        "id": "jp-2026-11-14-toki",
        "title": "Toki-no-Hiroba / Osaka Station",
        "date": "2026-11-14",
        "category": "viewpoint",
        "categories": [
          "viewpoint",
          "photography"
        ],
        "location": {
          "name": "Toki-no-Hiroba / Osaka Station",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-14-umeda",
        "title": "Umeda",
        "date": "2026-11-14",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Umeda",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-14-umeda-sky",
        "title": "Umeda Sky Building",
        "date": "2026-11-14",
        "category": "viewpoint",
        "categories": [
          "viewpoint"
        ],
        "location": {
          "name": "Umeda Sky Building",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka",
        "estimatedCost": 2000,
        "currency": "JPY",
        "optional": true
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-15",
    "date": "2026-11-15",
    "weekday": "Dom",
    "dayNumber": "15",
    "month": "NOV",
    "city": "Kyoto",
    "area": "Nara Park, Gran Buda y traslado a Kioto",
    "dayType": "base-transition",
    "baseId": "kyoto",
    "previousBaseId": "osaka",
    "visitedCity": "Nara",
    "notes": "Nara durante el traslado entre bases. Resolver equipaje antes de entrar al parque.",
    "transportSummary": "Osaka-Namba → Kintetsu-Nara; después Nara → Kioto → Enmachi.",
    "reservationNote": "SIN RESERVA PREVIA · Tōdai-ji y Nara Park se resuelven el mismo día.",
    "keyNote": "No comprar pase Kintetsu sin calcular los trayectos reales.",
    "paceNote": "Nara Park y Naramachi son gratuitos; Tōdai-ji es la entrada principal a valorar.",
    "activities": [
      {
        "id": "jp-2026-11-15-checkout",
        "title": "Check-out Osaka",
        "date": "2026-11-15",
        "category": "travel",
        "categories": [
          "travel"
        ],
        "location": {
          "name": "Check-out Osaka",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka",
        "notes": "Antes de las 10:00.",
        "reservationId": "osaka-stay-2026"
      },
      {
        "id": "jp-2026-11-15-kintetsu",
        "title": "Osaka-Namba → Kintetsu-Nara",
        "date": "2026-11-15",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Osaka-Namba → Kintetsu-Nara",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka / Nara"
      },
      {
        "id": "jp-2026-11-15-nara-park",
        "title": "Nara Park",
        "date": "2026-11-15",
        "category": "nature",
        "categories": [
          "nature",
          "culture",
          "photography"
        ],
        "location": {
          "name": "Nara Park",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Nara"
      },
      {
        "id": "jp-2026-11-15-todaiji",
        "title": "Tōdai-ji · Gran Buda",
        "date": "2026-11-15",
        "category": "temple",
        "categories": [
          "temple"
        ],
        "location": {
          "name": "Tōdai-ji · Gran Buda",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Nara",
        "estimatedCost": 800,
        "currency": "JPY",
        "stampId": "jp-nara-todaiji"
      },
      {
        "id": "jp-2026-11-15-naramachi",
        "title": "Naramachi",
        "date": "2026-11-15",
        "category": "culture",
        "categories": [
          "culture",
          "shopping"
        ],
        "location": {
          "name": "Naramachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Nara"
      },
      {
        "id": "jp-2026-11-15-kyoto-transfer",
        "title": "Nara → Kioto → Enmachi · check-in Modish",
        "date": "2026-11-15",
        "category": "travel",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Nara → Kioto → Enmachi · check-in Modish",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto",
        "reservationId": "kyoto-stay-2026"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-16",
    "date": "2026-11-16",
    "weekday": "Lun",
    "dayNumber": "16",
    "month": "NOV",
    "city": "Kyoto",
    "area": "Kiyomizu, Higashiyama y Gion",
    "dayType": "standard",
    "baseId": "kyoto",
    "reservationNote": "Goshuincho / goshuin opcional en santuarios y templos, respetando las normas del recinto; sellos tradicionales independientes de Nioli.",
    "notes": "Salida objetivo 06:15–06:30. Recorrer Higashiyama en descenso desde Kiyomizu hasta Gion.",
    "transportSummary": "Combinar tren y caminata cuando convenga para evitar buses saturados.",
    "reservationNote": "SIN RESERVA PREVIA · Kiyomizu-dera para visita normal.",
    "keyNote": "Respetar calles privadas y normas de fotografía en Gion.",
    "paceNote": "Buscar las fotos principales antes de las 09:00.",
    "activities": [
      {
        "id": "jp-2026-11-16-kiyomizu",
        "title": "Kiyomizu-dera",
        "date": "2026-11-16",
        "category": "temple",
        "categories": [
          "temple"
        ],
        "location": {
          "name": "Kiyomizu-dera",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "startTime": "06:30",
        "city": "Kyoto",
        "stampId": "jp-kyoto-kiyomizu-dera"
      },
      {
        "id": "jp-2026-11-16-sannenzaka",
        "title": "Sannenzaka",
        "date": "2026-11-16",
        "category": "culture",
        "categories": [
          "culture",
          "photography"
        ],
        "location": {
          "name": "Sannenzaka",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-16-ninenzaka",
        "title": "Ninenzaka",
        "date": "2026-11-16",
        "category": "culture",
        "categories": [
          "culture",
          "photography"
        ],
        "location": {
          "name": "Ninenzaka",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-16-yasaka-pagoda",
        "title": "Pagoda Yasaka",
        "date": "2026-11-16",
        "category": "temple",
        "categories": [
          "temple",
          "photography"
        ],
        "location": {
          "name": "Pagoda Yasaka",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-16-maruyama",
        "title": "Maruyama Park",
        "date": "2026-11-16",
        "category": "nature",
        "categories": [
          "nature"
        ],
        "location": {
          "name": "Maruyama Park",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-16-yasaka",
        "title": "Yasaka Shrine",
        "date": "2026-11-16",
        "category": "temple",
        "categories": [
          "temple"
        ],
        "location": {
          "name": "Yasaka Shrine",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto",
        "stampId": "jp-kyoto-yasaka-shrine"
      },
      {
        "id": "jp-2026-11-16-gion",
        "title": "Gion",
        "date": "2026-11-16",
        "category": "culture",
        "categories": [
          "culture",
          "photography"
        ],
        "location": {
          "name": "Gion",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto",
        "stampId": "jp-kyoto-gion"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-17",
    "date": "2026-11-17",
    "weekday": "Mar",
    "dayNumber": "17",
    "month": "NOV",
    "city": "Kyoto",
    "area": "Arashiyama temprano, Tenryū-ji, Kinkaku-ji y Kitano",
    "dayType": "standard",
    "baseId": "kyoto",
    "reservationNote": "Goshuincho / goshuin opcional en santuarios y templos, respetando las normas del recinto; sellos tradicionales independientes de Nioli.",
    "notes": "Bamboo Grove al amanecer, Tenryū-ji con apertura otoñal temprana, luego Kinkaku-ji y zona Kitano/Enmachi. Chion-in se mueve al 19 por cercanía con Kawaramachi/Gion.",
    "reservationNote": "SIN RESERVA PREVIA · Bamboo Grove, Tenryū-ji (visita normal) y Kinkaku-ji.",
    "keyNote": "No intentar todas las entradas de Arashiyama.",
    "paceNote": "Referencia del documento: Kinkaku-ji ¥500; confirmar tarifa.",
    "activities": [
      {
        "id": "jp-2026-11-17-bamboo",
        "title": "Arashiyama Bamboo Grove",
        "date": "2026-11-17",
        "category": "nature",
        "categories": [
          "nature",
          "photography"
        ],
        "location": {
          "name": "Arashiyama Bamboo Grove",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto",
        "stampId": "jp-kyoto-arashiyama"
      },
      {
        "id": "jp-2026-11-17-katsura",
        "title": "Tenryū-ji · apertura otoñal 07:30",
        "date": "2026-11-17",
        "category": "nature",
        "categories": [
          "nature",
          "photography"
        ],
        "location": {
          "name": "Tenryū-ji · apertura otoñal 07:30",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-17-kinkaku",
        "title": "Kinkaku-ji",
        "date": "2026-11-17",
        "category": "temple",
        "categories": [
          "temple"
        ],
        "location": {
          "name": "Kinkaku-ji",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto",
        "estimatedCost": 500,
        "currency": "JPY",
        "stampId": "jp-kyoto-kinkakuji"
      },
      {
        "id": "jp-2026-11-17-chionin",
        "title": "Kitano Tenmangū / regreso por Enmachi",
        "date": "2026-11-17",
        "category": "temple",
        "categories": [
          "temple",
          "culture"
        ],
        "location": {
          "name": "Kitano Tenmangū / regreso por Enmachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto",
        "notes": "Bloque flexible cerca de la base; no requiere reserva para la visita normal.",
        "optional": true
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-18",
    "date": "2026-11-18",
    "weekday": "Mié",
    "dayNumber": "18",
    "month": "NOV",
    "city": "Kyoto",
    "area": "Fushimi Inari y Fushimi menos turístico",
    "dayType": "standard",
    "baseId": "kyoto",
    "reservationNote": "Goshuincho / goshuin opcional en santuarios y templos, respetando las normas del recinto; sellos tradicionales independientes de Nioli.",
    "notes": "Fushimi Inari alrededor de 06:30–07:00; después Fushimi histórico, canales y calles de sake.",
    "reservationNote": "SIN RESERVA PREVIA · Fushimi Inari para visita normal.",
    "keyNote": "Santuario y senderos principales gratuitos.",
    "paceNote": "Evitar concentrarse en los primeros 200 metros, donde se acumulan las fotos.",
    "activities": [
      {
        "id": "jp-2026-11-18-fushimi-inari",
        "title": "Fushimi Inari",
        "date": "2026-11-18",
        "category": "temple",
        "categories": [
          "temple"
        ],
        "location": {
          "name": "Fushimi Inari",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "startTime": "06:30",
        "city": "Kyoto",
        "stampId": "jp-kyoto-fushimi-inari"
      },
      {
        "id": "jp-2026-11-18-torii",
        "title": "Sendero más allá de los primeros torii",
        "date": "2026-11-18",
        "category": "nature",
        "categories": [
          "nature",
          "culture",
          "photography"
        ],
        "location": {
          "name": "Sendero más allá de los primeros torii",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto",
        "optional": true
      },
      {
        "id": "jp-2026-11-18-fushimi-district",
        "title": "Distrito histórico de Fushimi",
        "date": "2026-11-18",
        "category": "culture",
        "categories": [
          "culture"
        ],
        "location": {
          "name": "Distrito histórico de Fushimi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-18-canals",
        "title": "Canales y calles de sake",
        "date": "2026-11-18",
        "category": "culture",
        "categories": [
          "culture",
          "photography"
        ],
        "location": {
          "name": "Canales y calles de sake",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-18-uji",
        "title": "Uji",
        "date": "2026-11-18",
        "category": "culture",
        "categories": [
          "culture"
        ],
        "location": {
          "name": "Uji",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Uji",
        "notes": "Sólo como alternativa si hay interés específico.",
        "optional": true
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-19",
    "date": "2026-11-19",
    "weekday": "Jue",
    "dayNumber": "19",
    "month": "NOV",
    "city": "Kyoto",
    "area": "Nijō, Sanjō-kai, Nishiki, Kawaramachi y Chion-in",
    "dayType": "relaxed",
    "baseId": "kyoto",
    "reservationNote": "Goshuincho / goshuin opcional en santuarios y templos, respetando las normas del recinto; sellos tradicionales independientes de Nioli.",
    "notes": "Ruta central compacta: Nijō → Sanjō-kai → Nishiki → Kawaramachi/segunda mano → Chion-in Autumn Light-up 17:30–21:30.",
    "reservationNote": "Ninomaru: SIN RESERVA PREVIA. Honmaru Palace: RESERVA OBLIGATORIA si se añade. Chion-in light-up general: SIN RESERVA PREVIA.",
    "keyNote": "Honmaru sólo se añade si conseguimos horario; no es necesario para visitar Nijō/Ninomaru.",
    "paceNote": "Mantener margen para llegar a Chion-in después de Kawaramachi; iluminación desde las 17:30.",
    "activities": [
      {
        "id": "jp-2026-11-19-nijo",
        "title": "Castillo Nijō",
        "date": "2026-11-19",
        "category": "culture",
        "categories": [
          "culture"
        ],
        "location": {
          "name": "Castillo Nijō",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto",
        "optional": true
      },
      {
        "id": "jp-2026-11-19-gyoen",
        "title": "Nishiki Market",
        "date": "2026-11-19",
        "category": "food",
        "categories": [
          "food",
          "shopping",
          "culture"
        ],
        "location": {
          "name": "Nishiki Market",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-19-sanjo-kai",
        "title": "Sanjō-kai Shopping Street",
        "date": "2026-11-19",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Sanjō-kai Shopping Street",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-19-kawaramachi",
        "title": "Kawaramachi",
        "date": "2026-11-19",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Kawaramachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-19-bookoff",
        "title": "BOOKOFF PLUS Kawaramachi OPA",
        "date": "2026-11-19",
        "category": "shopping",
        "categories": [
          "shopping",
          "geek"
        ],
        "location": {
          "name": "BOOKOFF PLUS Kawaramachi OPA",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-19-2ndstreet",
        "title": "2nd STREET Shijo-Kawaramachi",
        "date": "2026-11-19",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "2nd STREET Shijo-Kawaramachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-19-laundry",
        "title": "Chion-in Autumn Light-up · 17:30–21:30",
        "date": "2026-11-19",
        "category": "culture",
        "categories": [
          "culture",
          "temple",
          "photography"
        ],
        "location": {
          "name": "Chion-in Autumn Light-up · 17:30–21:30",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "startTime": "17:30",
        "endTime": "21:30",
        "city": "Kyoto"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-20",
    "date": "2026-11-20",
    "weekday": "Vie",
    "dayNumber": "20",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Shinkansen y check-in Shiinamachi",
    "dayType": "base-transition",
    "baseId": "tokyo",
    "previousBaseId": "kyoto",
    "notes": "Cambio de base: Kioto → Tokio. Check-in en Shiinamachi/Toshima y tarde suave.",
    "transportSummary": "Enmachi → Kyoto Station → Tokaido Shinkansen → Tokio → Shiinamachi.",
    "reservationNote": "Cotizar SmartEX y tarifa ordinaria. Equipaje de más de 160 cm lineales requiere la reserva correspondiente.",
    "keyNote": "No reservar una actividad con hora fija al llegar.",
    "activities": [
      {
        "id": "jp-2026-11-20-kyoto-station",
        "title": "Enmachi → Kyoto Station",
        "date": "2026-11-20",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Enmachi → Kyoto Station",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto"
      },
      {
        "id": "jp-2026-11-20-shinkansen",
        "title": "Tokaido Shinkansen · Kioto → Tokio",
        "date": "2026-11-20",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Tokaido Shinkansen · Kioto → Tokio",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto / Tokyo"
      },
      {
        "id": "jp-2026-11-20-checkin",
        "title": "Check-in BBhouse Shiinamachi",
        "date": "2026-11-20",
        "category": "travel",
        "categories": [
          "travel"
        ],
        "location": {
          "name": "Check-in BBhouse Shiinamachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo",
        "reservationId": "tokyo-stay-2026"
      },
      {
        "id": "jp-2026-11-20-ikebukuro",
        "title": "Ikebukuro · paseo suave y abastecimiento",
        "date": "2026-11-20",
        "category": "leisure",
        "categories": [
          "leisure",
          "shopping"
        ],
        "location": {
          "name": "Ikebukuro · paseo suave y abastecimiento",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-21",
    "date": "2026-11-21",
    "weekday": "Sáb",
    "dayNumber": "21",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Asakusa, Kappabashi y vistas de Skytree",
    "dayType": "standard",
    "baseId": "tokyo",
    "reservationNote": "Asakusa Culture Tourist Information Center: mirador gratuito opcional; no pagar Skytree solo por las vistas.",
    "notes": "Senso-ji temprano, luego compras útiles en Kappabashi y vistas gratuitas hacia Skytree.",
    "reservationNote": "SIN RESERVA PREVIA · Asakusa y el mirador del Tourist Information Center.",
    "keyNote": "Kappabashi suele abrir más tarde que el templo.",
    "paceNote": "Skytree pago sólo si se desea subir expresamente; la terraza de Asakusa es la alternativa de ahorro.",
    "activities": [
      {
        "id": "jp-2026-11-21-sensoji",
        "title": "Senso-ji",
        "date": "2026-11-21",
        "category": "temple",
        "categories": [
          "temple"
        ],
        "location": {
          "name": "Senso-ji",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-21-nakamise",
        "title": "Nakamise",
        "date": "2026-11-21",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Nakamise",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-21-kappabashi",
        "title": "Kappabashi",
        "date": "2026-11-21",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Kappabashi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-21-daiso",
        "title": "DAISO Asakusa ROX",
        "date": "2026-11-21",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "DAISO Asakusa ROX",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-21-tourist-center",
        "title": "Asakusa Culture Tourist Information Center · terraza",
        "date": "2026-11-21",
        "category": "viewpoint",
        "categories": [
          "viewpoint",
          "photography"
        ],
        "location": {
          "name": "Asakusa Culture Tourist Information Center · terraza",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-21-skytree-exterior",
        "title": "Tokyo Skytree · vistas exteriores",
        "date": "2026-11-21",
        "category": "photography",
        "categories": [
          "photography",
          "viewpoint"
        ],
        "location": {
          "name": "Tokyo Skytree · vistas exteriores",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-22",
    "date": "2026-11-22",
    "weekday": "Dom",
    "dayNumber": "22",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Ueno, Ameyoko y Akihabara",
    "dayType": "standard",
    "baseId": "tokyo",
    "notes": "Ueno y Ameyoko antes de concentrar la tarde en segunda mano y coleccionismo de Akihabara.",
    "keyNote": "Comparar segunda mano contra precio oficial nuevo.",
    "paceNote": "Mandarake suele abrir hacia el mediodía; revisar horario y sucursal.",
    "activities": [
      {
        "id": "jp-2026-11-22-ueno",
        "title": "Ueno Park",
        "date": "2026-11-22",
        "category": "nature",
        "categories": [
          "nature",
          "culture"
        ],
        "location": {
          "name": "Ueno Park",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-22-ameyoko",
        "title": "Ameyoko",
        "date": "2026-11-22",
        "category": "shopping",
        "categories": [
          "shopping",
          "food"
        ],
        "location": {
          "name": "Ameyoko",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-22-bookoff",
        "title": "BOOKOFF Akihabara Ekimae",
        "date": "2026-11-22",
        "category": "shopping",
        "categories": [
          "shopping",
          "geek"
        ],
        "location": {
          "name": "BOOKOFF Akihabara Ekimae",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-22-surugaya",
        "title": "Surugaya Akihabara",
        "date": "2026-11-22",
        "category": "shopping",
        "categories": [
          "shopping",
          "geek"
        ],
        "location": {
          "name": "Surugaya Akihabara",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-22-mandarake",
        "title": "Mandarake Complex",
        "date": "2026-11-22",
        "category": "shopping",
        "categories": [
          "shopping",
          "geek"
        ],
        "location": {
          "name": "Mandarake Complex",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-23",
    "date": "2026-11-23",
    "weekday": "Lun",
    "dayNumber": "23",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Shinjuku, mirador gratis y Kagurazaka",
    "dayType": "standard",
    "baseId": "tokyo",
    "reservationNote": "Mirador gratuito Tokyo Metropolitan Government Building sujeto a horario del observatorio y cierres.",
    "notes": "Día festivo en Japón. Mirador metropolitano gratuito, Shinjuku y Kagurazaka.",
    "reservationNote": "SIN RESERVA PREVIA · Tokyo Metropolitan Government Observatory funciona por orden de llegada.",
    "keyNote": "No Disney este día festivo. Verificar apertura, mantenimiento y aforo del observatorio.",
    "paceNote": "Tokyo Night & Light sólo si la programación oficial lo confirma.",
    "activities": [
      {
        "id": "jp-2026-11-23-tocho",
        "title": "Tokyo Metropolitan Government Building",
        "date": "2026-11-23",
        "category": "viewpoint",
        "categories": [
          "viewpoint",
          "photography"
        ],
        "location": {
          "name": "Tokyo Metropolitan Government Building",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-23-shinjuku",
        "title": "Shinjuku",
        "date": "2026-11-23",
        "category": "culture",
        "categories": [
          "culture",
          "shopping"
        ],
        "location": {
          "name": "Shinjuku",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-23-kagurazaka",
        "title": "Kagurazaka",
        "date": "2026-11-23",
        "category": "culture",
        "categories": [
          "culture",
          "photography"
        ],
        "location": {
          "name": "Kagurazaka",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-23-night-light",
        "title": "Tokyo Night & Light",
        "date": "2026-11-23",
        "category": "culture",
        "categories": [
          "culture"
        ],
        "location": {
          "name": "Tokyo Night & Light",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo",
        "notes": "Sólo si está programado.",
        "optional": true
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-24",
    "date": "2026-11-24",
    "weekday": "Mar",
    "dayNumber": "24",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Meiji Jingu, Harajuku, Shibuya y Pokémon Center",
    "dayType": "standard",
    "baseId": "tokyo",
    "reservationNote": "Meiji Jingu → Harajuku → Cat Street → Shibuya PARCO; Shibuya Sky sólo si se reserva y encaja. No reservar entradas para parques este día.",
    "notes": "Ruta oeste entre dos días de parque: Meiji Jingu → Harajuku → Omotesando → Shibuya.",
    "keyNote": "Shibuya Sky sólo si se elige como observatorio pago principal.",
    "paceNote": "Regresar temprano para descansar antes de PokéPark; dejar compras grandes para el final del día.",
    "activities": [
      {
        "id": "jp-2026-11-24-meiji",
        "title": "Meiji Jingu",
        "date": "2026-11-24",
        "category": "temple",
        "categories": [
          "temple"
        ],
        "location": {
          "name": "Meiji Jingu",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-24-harajuku",
        "title": "Harajuku",
        "date": "2026-11-24",
        "category": "shopping",
        "categories": [
          "shopping",
          "culture"
        ],
        "location": {
          "name": "Harajuku",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-24-omotesando",
        "title": "Omotesando",
        "date": "2026-11-24",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Omotesando",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-24-shibuya",
        "title": "Shibuya Crossing + Hachiko",
        "date": "2026-11-24",
        "category": "photography",
        "categories": [
          "photography",
          "culture"
        ],
        "location": {
          "name": "Shibuya Crossing + Hachiko",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-24-pokemon",
        "title": "Pokémon Center Shibuya",
        "date": "2026-11-24",
        "category": "geek",
        "categories": [
          "geek",
          "shopping"
        ],
        "location": {
          "name": "Pokémon Center Shibuya",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-24-nintendo",
        "title": "Nintendo Tokyo",
        "date": "2026-11-24",
        "category": "geek",
        "categories": [
          "geek",
          "shopping",
          "gaming"
        ],
        "location": {
          "name": "Nintendo Tokyo",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-24-shibuya-sky",
        "title": "Shibuya Sky",
        "date": "2026-11-24",
        "category": "viewpoint",
        "categories": [
          "viewpoint"
        ],
        "location": {
          "name": "Shibuya Sky",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo",
        "optional": true
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-25",
    "date": "2026-11-25",
    "weekday": "Mié",
    "dayNumber": "25",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Tokyo DisneySea · PLAN FIJO",
    "dayType": "theme-park",
    "baseId": "tokyo",
    "notes": "DisneySea: salir 05:45–06:00 desde Shiinamachi. Alimentación orientativa ¥7.000 los dos; Premier Access Frozen/Soaring opcional.",
    "reservationNote": "FECHA ELEGIDA · COMPRA PENDIENTE · el día no se mueve; comprar 1-Day Passport por canal oficial cuando sea posible.",
    "keyNote": "Priorizar Frozen, revisar Premier Access al ingresar y no asumir Indiana Jones abierto.",
    "paceNote": "Horario publicado de referencia: 09:00–21:00; verificar antes de ir.",
    "activities": [
      {
        "id": "jp-2026-11-25-disney-transfer",
        "title": "Shiinamachi → Maihama / DisneySea",
        "date": "2026-11-25",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Shiinamachi → Maihama / DisneySea",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-25-disneysea",
        "title": "Tokyo DisneySea",
        "date": "2026-11-25",
        "category": "theme-park",
        "categories": [
          "theme-park"
        ],
        "location": {
          "name": "Tokyo DisneySea",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo",
        "reservationId": "disneysea-2026-11-25"
      },
      {
        "id": "jp-2026-11-25-disney-return",
        "title": "Regreso a Shiinamachi",
        "date": "2026-11-25",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Regreso a Shiinamachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-26",
    "date": "2026-11-26",
    "weekday": "Jue",
    "dayNumber": "26",
    "month": "NOV",
    "city": "Tokyo",
    "area": "PokéPark KANTO · CONFIRMADO",
    "dayType": "pokemon-full-day",
    "baseId": "tokyo",
    "notes": "PokéPark KANTO confirmado con Trainer’s Pass. Llegar con margen suficiente.",
    "reservationNote": "CONFIRMADO · Trainer’s Pass. Pokémon Forest 14:00–15:00. Limited-Access Tickets internos se solicitan el mismo día en la app desde las 10:45, según disponibilidad.",
    "keyNote": "Llevar pasaporte original si las condiciones aplicables lo exigen, entrada accesible sin conexión y batería externa. No compartir número de ticket.",
    "paceNote": "La ventana 14:00–15:00 es de acceso, no duración garantizada del recorrido.",
    "activities": [
      {
        "id": "jp-2026-11-26-poke-transfer",
        "title": "Shiinamachi → Yomiuriland",
        "date": "2026-11-26",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Shiinamachi → Yomiuriland",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo / Yomiuriland"
      },
      {
        "id": "jp-2026-11-26-sedge",
        "title": "Sedge Town / Yomiuriland",
        "date": "2026-11-26",
        "category": "theme-park",
        "categories": [
          "theme-park",
          "geek"
        ],
        "location": {
          "name": "Sedge Town / Yomiuriland",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Yomiuriland",
        "reservationId": "pokepark-2026-11-26"
      },
      {
        "id": "jp-2026-11-26-forest",
        "title": "Pokémon Forest · ventana de entrada",
        "date": "2026-11-26",
        "category": "theme-park",
        "categories": [
          "theme-park",
          "geek",
          "nature"
        ],
        "location": {
          "name": "Pokémon Forest · ventana de entrada",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "startTime": "14:00",
        "endTime": "15:00",
        "city": "Yomiuriland",
        "reservationId": "pokepark-2026-11-26",
        "stampId": "jp-kanto-pokepark"
      },
      {
        "id": "jp-2026-11-26-poke-return",
        "title": "Regreso a Shiinamachi",
        "date": "2026-11-26",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Regreso a Shiinamachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-27",
    "date": "2026-11-27",
    "weekday": "Vie",
    "dayNumber": "27",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Odaiba / recuperación · FLEX",
    "dayType": "relaxed",
    "baseId": "tokyo",
    "notes": "Odaiba y descanso tras PokéPark. teamLab opcional si existe entrada comprada. No incluir Disneyland.",
    "reservationNote": "DÍA FLEXIBLE · sin entradas obligatorias",
    "keyNote": "Pasear por Odaiba a ritmo suave, evitando traslados innecesarios.",
    "paceNote": "Priorizar paseo suave y regreso temprano.",
    "activities": [
      {
        "id": "jp-2026-11-27-disney-transfer",
        "title": "Shiinamachi → Odaiba",
        "date": "2026-11-27",
        "category": "transport",
        "categories": ["travel", "transport"],
        "location": {"name": "Shiinamachi → Odaiba", "address": null, "latitude": null, "longitude": null, "placeId": null},
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-27-disneyland",
        "title": "Odaiba waterfront",
        "date": "2026-11-27",
        "category": "theme-park",
        "categories": ["theme-park"],
        "location": {"name": "Odaiba", "address": null, "latitude": null, "longitude": null, "placeId": null},
        "city": "Tokyo",
        "optional": true
      },
      {
        "id": "jp-2026-11-27-disney-priority",
        "title": "DiverCity / waterfront opcional",
        "date": "2026-11-27",
        "category": "theme-park",
        "categories": ["theme-park"],
        "location": {"name": "Odaiba", "address": null, "latitude": null, "longitude": null, "placeId": null},
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-27-disney-return",
        "title": "Regreso a Shiinamachi",
        "date": "2026-11-27",
        "category": "transport",
        "categories": ["travel", "transport"],
        "location": {"name": "Regreso a Shiinamachi", "address": null, "latitude": null, "longitude": null, "placeId": null},
        "city": "Tokyo"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-28",
    "date": "2026-11-28",
    "weekday": "Sáb",
    "dayNumber": "28",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Fuji / Kawaguchiko · clima",
    "dayType": "standard",
    "baseId": "tokyo",
    "notes": "Si hace buen clima: Kawaguchiko y Oishi Park. ALTERNATIVA: Shiraito Falls + Otodome Falls en Fujinomiya sólo con transporte viable. No combinar por defecto. Con lluvia/mala visibilidad: Nakano, Koenji y descanso.",
    "keyNote": "Elegir el plan por visibilidad y transporte confirmado. Cascadas opcionales, nunca obligatorias.",
    "paceNote": "Revisar estado, etiquetas y políticas de devolución; llevar lista de deseos.",
    "activities": [
      {
        "id": "jp-2026-11-28-option-1",
        "title": "Kawaguchiko · vistas del Monte Fuji",
        "date": "2026-11-28",
        "category": "nature",
        "categories": [
          "nature"
        ],
        "location": {
          "name": "Kawaguchiko · vistas del Monte Fuji",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kawaguchiko",
        "notes": "PLAN A sólo con buena visibilidad. Verificar transporte desde Shinjuku y regreso.",
        "optional": true
      },
      {
        "id": "jp-2026-11-28-option-2",
        "title": "Oishi Park · orilla norte de Kawaguchiko",
        "date": "2026-11-28",
        "category": "nature",
        "categories": [
          "nature"
        ],
        "location": {
          "name": "Oishi Park · orilla norte de Kawaguchiko",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kawaguchiko",
        "notes": "PLAN A junto al lago; no obligatorio si se eligen cascadas.",
        "optional": true
      },
      {
        "id": "jp-2026-11-28-option-3",
        "title": "Shiraito Falls + Otodome Falls · Fujinomiya",
        "date": "2026-11-28",
        "category": "nature",
        "categories": [
          "nature"
        ],
        "location": {
          "name": "Shiraito Falls + Otodome Falls · Fujinomiya",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Fujinomiya",
        "notes": "PLAN B ALTERNATIVO de cascadas, sólo con clima y autobús viable. No combinar automáticamente con Oishi Park.",
        "optional": true
      },
      {
        "id": "jp-2026-11-28-option-4",
        "title": "Nakano Broadway / Koenji · plan por lluvia",
        "date": "2026-11-28",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Nakano Broadway / Koenji · plan por lluvia",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo",
        "notes": "PLAN C si Fuji no se ve o el transporte no conviene.",
        "optional": true
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-29",
    "date": "2026-11-29",
    "weekday": "Dom",
    "dayNumber": "29",
    "month": "NOV",
    "city": "Tokyo",
    "area": "HARD OFF Oizumigakuen · retro y compras finales",
    "dayType": "relaxed",
    "baseId": "tokyo",
    "notes": "Día principal para buscar Game Boy/retro fuera de Akihabara, aprovechando la conexión desde Shiinamachi por la Seibu Ikebukuro Line. Después volver hacia Ikebukuro y cerrar compras.",
    "reservationNote": "SIN RESERVA PREVIA.",
    "keyNote": "Objetivo Game Boy Advance SP funcional: comparar estado y precio; evitar JUNK salvo que podamos probarla y sepamos exactamente el fallo.",
    "paceNote": "Vuelo NRT T1 a las 09:35 del lunes; terminar temprano, preparar equipaje y valorar hotel cerca de Narita el 29, sólo si se reserva.",
    "activities": [
      {
        "id": "jp-2026-11-29-hardoff",
        "title": "HARD OFF Oizumigakuen · Game Boy y retro",
        "date": "2026-11-29",
        "category": "shopping",
        "categories": ["shopping", "gaming", "geek"],
        "location": {"name": "HARD OFF Oizumigakuen", "address": null, "latitude": null, "longitude": null, "placeId": null},
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-29-ikebukuro",
        "title": "Ikebukuro · comparación / compras pendientes",
        "date": "2026-11-29",
        "category": "shopping",
        "categories": ["shopping", "geek"],
        "location": {"name": "Ikebukuro", "address": null, "latitude": null, "longitude": null, "placeId": null},
        "city": "Tokyo",
        "optional": true
      },
      {
        "id": "jp-2026-11-29-shopping",
        "title": "Compras finales y revisión de recibos tax-free",
        "date": "2026-11-29",
        "category": "shopping",
        "categories": ["shopping"],
        "location": {"name": "Compras finales", "address": null, "latitude": null, "longitude": null, "placeId": null},
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-29-laundry",
        "title": "Lavandería",
        "date": "2026-11-29",
        "category": "leisure",
        "categories": ["leisure"],
        "location": {"name": "Lavandería", "address": null, "latitude": null, "longitude": null, "placeId": null},
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-29-packing",
        "title": "Preparar equipaje y separar compras tax-free",
        "date": "2026-11-29",
        "category": "travel",
        "categories": ["travel"],
        "location": {"name": "Preparar equipaje", "address": null, "latitude": null, "longitude": null, "placeId": null},
        "city": "Tokyo"
      }
    ]
  },
  {
    "id": "jp-2026-day-2026-11-30",
    "date": "2026-11-30",
    "weekday": "Lun",
    "dayNumber": "30",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Salida · aeropuerto y reembolso tax-free",
    "dayType": "travel",
    "previousBaseId": "tokyo",
    "notes": "Día exclusivamente de salida. Reserva Aeroméxico: AM0057 NRT T1 09:35 → MEX T2 07:20; AM0656 MEX T2 19:05 → SJO 22:15. Llegada sugerida a NRT ~06:35.",
    "transportSummary": "Narita T1 confirmado. Verificar primer tren desde Shiinamachi o planificar alojamiento cerca de Narita noche anterior.",
    "keyNote": "Hacer verificación aduanera/tax-free antes de entregar cualquier equipaje que contenga compras que Aduanas pueda pedir inspeccionar.",
    "paceNote": "No planear atracciones este día.",
    "activities": [
      {
        "id": "jp-2026-11-30-checkout",
        "title": "Check-out BBhouse Shiinamachi",
        "date": "2026-11-30",
        "category": "travel",
        "categories": [
          "travel"
        ],
        "location": {
          "name": "Check-out BBhouse Shiinamachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo",
        "reservationId": "tokyo-stay-2026"
      },
      {
        "id": "jp-2026-11-30-airport",
        "title": "Traslado a Narita T1 para salida 09:35",
        "date": "2026-11-30",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Traslado al aeropuerto correspondiente",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-30-taxfree",
        "title": "Verificación aduanera / reembolso tax-free",
        "date": "2026-11-30",
        "category": "travel",
        "categories": [
          "travel"
        ],
        "location": {
          "name": "Verificación aduanera / reembolso tax-free",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Aeropuerto",
        "notes": "Conservar recibos y seguir el procedimiento vigente desde noviembre de 2026."
      }
    ]
  }
];

export const japan2026Trip: Trip = {
  id: "japan-2026",
  name: "Japón 2026",
  countryId: "japan",
  startDate: "2026-11-11",
  endDate: "2026-11-30",
  dateRange: "11 — 30 Nov 2026",
  countdownDays: 13,
  currentCity: "San José",
  timezones: { origin: "America/Costa_Rica", destination: "Asia/Tokyo" },
  worldClock: {
    origin: { city: "San José", countryCode: "CR", timeZone: "America/Costa_Rica" },
    destination: { city: "Tokio", countryCode: "JP", timeZone: "Asia/Tokyo" }
  },
  participants: [
    { id: "andy", name: "Andy", initials: "AN", color: "#6f56b7" },
    { id: "jose", name: "José", initials: "JO", color: "#df5753" }
  ],
  route: ["Osaka", "Nara", "Kioto", "Tokio"],
  bases: [
  {
    "id": "osaka",
    "city": "Osaka",
    "icon": "🏯",
    "checkInDate": "2026-11-11",
    "checkOutDate": "2026-11-15",
    "nights": 4,
    "status": "confirmed",
    "area": "Naniwa / Motomachi",
    "location": {
      "name": "Kinna · Naniwa/Motomachi",
      "address": null,
      "latitude": null,
      "longitude": null,
      "placeId": null
    },
    "checkInTime": "15:00",
    "checkOutTime": "10:00",
    "reservationId": "osaka-stay-2026",
    "provider": "Kinna",
    "documentIds": [],
    "photoIds": []
  },
  {
    "id": "kyoto",
    "city": "Kyoto",
    "icon": "⛩️",
    "checkInDate": "2026-11-15",
    "checkOutDate": "2026-11-20",
    "nights": 5,
    "status": "confirmed",
    "area": "Enmachi",
    "location": {
      "name": "Modish · área Enmachi",
      "address": null,
      "latitude": null,
      "longitude": null,
      "placeId": null
    },
    "checkInTime": null,
    "checkOutTime": null,
    "reservationId": "kyoto-stay-2026",
    "provider": "Modish",
    "documentIds": [],
    "photoIds": []
  },
  {
    "id": "tokyo",
    "city": "Tokyo",
    "icon": "🗼",
    "checkInDate": "2026-11-20",
    "checkOutDate": "2026-11-30",
    "nights": 10,
    "status": "confirmed",
    "area": "Shiinamachi / Toshima",
    "location": {
      "name": "BBhouse Shiinamachi",
      "address": null,
      "latitude": null,
      "longitude": null,
      "placeId": null
    },
    "checkInTime": null,
    "checkOutTime": null,
    "reservationId": "tokyo-stay-2026",
    "provider": "BBhouse Shiinamachi",
    "documentIds": [],
    "photoIds": []
  }
],
  flightSegments: [],
  savedPlaces: [],
  budget: { amount: 0, currency: "JPY" },
  itinerary,
  expenses: [],
  reservations: [
  {
    "id": "osaka-stay-2026",
    "type": "hotel",
    "provider": "Kinna",
    "code": "",
    "title": "Alojamiento Osaka · Kinna",
    "subtitle": "Naniwa / Motomachi · 11–15 nov",
    "date": "11 Nov 2026",
    "dateISO": "2026-11-11",
    "time": "15:00",
    "status": "confirmed",
    "accent": "#6f56b7",
    "meta": "Check-in después de 15:00 · check-out antes de 10:00"
  },
  {
    "id": "kyoto-stay-2026",
    "type": "hotel",
    "provider": "Modish",
    "code": "",
    "title": "Alojamiento Kioto · Modish",
    "subtitle": "Área Enmachi · 15–20 nov",
    "date": "15 Nov 2026",
    "dateISO": "2026-11-15",
    "time": "",
    "status": "confirmed",
    "accent": "#6f56b7",
    "meta": "Dirección completa pendiente de cargar"
  },
  {
    "id": "tokyo-stay-2026",
    "type": "hotel",
    "provider": "BBhouse Shiinamachi",
    "code": "",
    "title": "Alojamiento Tokio · BBhouse Shiinamachi",
    "subtitle": "Shiinamachi / Toshima · 20–30 nov",
    "date": "20 Nov 2026",
    "dateISO": "2026-11-20",
    "time": "",
    "status": "confirmed",
    "accent": "#6f56b7",
    "meta": "Dirección completa y horarios finos pendientes de cargar"
  },
  {
    "id": "usj-2026-11-12",
    "type": "ticket",
    "provider": "Universal Studios Japan",
    "code": "",
    "title": "Universal Studios Japan",
    "subtitle": "Jueves 12 nov · CONFIRMADO",
    "date": "12 Nov 2026",
    "dateISO": "2026-11-12",
    "time": "",
    "status": "confirmed",
    "accent": "#0c8f69",
    "meta": "CONFIRMADO · Express Pass con SUPER NINTENDO WORLD 11:30–12:30; Mario Kart 11:30–12:00; Yoshi 12:00–12:30"
  },
  {
    "id": "disneysea-2026-11-25",
    "type": "ticket",
    "provider": "Tokyo Disney Resort",
    "code": "",
    "title": "Tokyo DisneySea",
    "subtitle": "Miércoles 25 nov · FECHA ELEGIDA",
    "date": "25 Nov 2026",
    "dateISO": "2026-11-25",
    "time": "",
    "status": "pending",
    "accent": "#df5753",
    "meta": "COMPRA PENDIENTE — OBLIGATORIA · fecha fija del itinerario; comprar por canal oficial"
  },
  {
    "id": "pokepark-2026-11-26",
    "type": "ticket",
    "provider": "PokéPark KANTO",
    "code": "",
    "title": "PokéPark KANTO · Trainer’s Pass",
    "subtitle": "Pokémon Forest 14:00–15:00",
    "date": "26 Nov 2026",
    "dateISO": "2026-11-26",
    "time": "14:00",
    "status": "confirmed",
    "accent": "#0c8f69",
    "meta": "CONFIRMADO · número de ticket no almacenado en el itinerario"
  }
],
  achievements: japanAchievements,
  photos: [],
  routeOptions: [
    { id: "fastest", label: "Más rápido", icon: "⚡", description: "Prioriza el menor tiempo de viaje." },
    { id: "cheapest", label: "Más barato", icon: "💴", description: "Prioriza el costo estimado más bajo." },
    { id: "walking", label: "Menos caminata", icon: "👟", description: "Reduce al mínimo los trayectos a pie." }
  ],
  settings: {
    creatorName: "Andy",
    destinationTimeZone: "Asia/Tokyo",
    initialCity: "Osaka",
    passportTemplateId: "japan",
    companionProfileId: "japan-geek",
    storageMode: "cloud",
    mapProvider: "google",
    lastPdfImport: {
      fileName: "Nioli_Japon_2026_Guia_Maestra.pdf",
      checksum: "844f2910df1c90c9676144710f29e4afd3219197767204edbc8fe1f9126dc0a8",
      standardVersion: "nioli-guia-maestra-2026-10-14",
      importedAt: "2026-10-14T15:01:00.000Z",
      daysChanged: 20,
      activitiesChanged: 97,
      reservationsChanged: 6
    },
    protected: true,
    createdAt: "2026-08-25T19:00:14.669Z",
    updatedAt: "2026-10-30T05:50:00.000Z"
  }
};

assertTripTemplate(japan2026Trip);
assertJapan2026Baseline(japan2026Trip);
