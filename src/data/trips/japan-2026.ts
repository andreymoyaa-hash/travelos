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
    "area": "Llegada, Namba y abastecimiento",
    "dayType": "recovery",
    "baseId": "osaka",
    "notes": "Primer día ligero: traslado, check-in y abastecimiento. Dotonbori sólo si queda energía.",
    "transportSummary": "Llegada → Motomachi/Namba. La ruta puerta a puerta queda pendiente de confirmar aeropuerto y vuelo.",
    "foodPause": "Comprar desayuno, agua y snacks en supermercado para evitar depender de aeropuerto o konbini.",
    "keyNote": "No reservar atracciones este día.",
    "paceNote": "Plan lluvia: compras bajo techo. Priorizar adaptación y descanso.",
    "activities": [
      {
        "id": "jp-2026-11-11-transfer",
        "title": "Traslado al alojamiento en Motomachi",
        "date": "2026-11-11",
        "category": "transport",
        "categories": [
          "travel",
          "transport"
        ],
        "location": {
          "name": "Traslado al alojamiento en Motomachi",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka",
        "notes": "Ruta exacta desde el aeropuerto se confirmará cuando estén definidos aeropuerto, terminal y horario."
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
        "title": "Life / Daikokucho · desayuno, agua, snacks e higiene",
        "date": "2026-11-11",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Life / Daikokucho · desayuno, agua, snacks e higiene",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-11-dotonbori",
        "title": "Dotonbori nocturno si queda energía",
        "date": "2026-11-11",
        "category": "leisure",
        "categories": [
          "leisure",
          "food",
          "photography"
        ],
        "location": {
          "name": "Dotonbori nocturno si queda energía",
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
    "area": "Universal Studios Japan · pendiente de comprar",
    "dayType": "theme-park",
    "baseId": "osaka",
    "notes": "USJ propuesto para el jueves 12. Usar la app oficial, registrar Studio Passes y gestionar entrada programada a Super Nintendo World cuando corresponda.",
    "transportSummary": "Salir temprano desde Namba hacia Universal City; confirmar transbordos el mismo día.",
    "reservationNote": "Entrada pendiente. Comparar el precio oficial del 12 con el 13 antes de pagar; el 13 inicia programación navideña.",
    "keyNote": "No asumir acceso a Super Nintendo World sin comprobar condiciones.",
    "paceNote": "Express Pass sólo si la espera prevista justifica el precio.",
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
        "title": "Mario Kart",
        "date": "2026-11-12",
        "category": "theme-park",
        "categories": [
          "theme-park",
          "gaming"
        ],
        "location": {
          "name": "Mario Kart",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-12-donkey-kong",
        "title": "Donkey Kong",
        "date": "2026-11-12",
        "category": "theme-park",
        "categories": [
          "theme-park",
          "gaming"
        ],
        "location": {
          "name": "Donkey Kong",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Osaka"
      },
      {
        "id": "jp-2026-11-12-harry-potter",
        "title": "Harry Potter",
        "date": "2026-11-12",
        "category": "theme-park",
        "categories": [
          "theme-park"
        ],
        "location": {
          "name": "Harry Potter",
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
    "id": "jp-2026-day-2026-11-13",
    "date": "2026-11-13",
    "weekday": "Vie",
    "dayNumber": "13",
    "month": "NOV",
    "city": "Osaka",
    "area": "Namba, Nipponbashi y segunda mano",
    "dayType": "standard",
    "baseId": "osaka",
    "notes": "Circuito caminable Motomachi → Namba → BOOKOFF → DAISO → Ota Road/Den Den Town → Surugaya → Mandarake → Dotonbori.",
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
    "transportSummary": "Consultar ticket y bus desde Minoh-Kayano la noche anterior.",
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
    "notes": "Salida objetivo 06:15–06:30. Recorrer Higashiyama en descenso desde Kiyomizu hasta Gion.",
    "transportSummary": "Combinar tren y caminata cuando convenga para evitar buses saturados.",
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
    "area": "Arashiyama, Kinkaku-ji e iluminación opcional",
    "dayType": "standard",
    "baseId": "kyoto",
    "notes": "Arashiyama temprano y luego Kinkaku-ji. Noche de Chion-in sólo si el programa oficial 2026 lo permite.",
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
        "title": "Río Katsura / Arashiyama",
        "date": "2026-11-17",
        "category": "nature",
        "categories": [
          "nature",
          "photography"
        ],
        "location": {
          "name": "Río Katsura / Arashiyama",
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
        "title": "Iluminación de Chion-in",
        "date": "2026-11-17",
        "category": "culture",
        "categories": [
          "culture"
        ],
        "location": {
          "name": "Iluminación de Chion-in",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Kyoto",
        "notes": "Sólo si horario y entradas 2026 están confirmados.",
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
    "notes": "Fushimi Inari alrededor de 06:30–07:00; después Fushimi histórico, canales y calles de sake.",
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
    "area": "Nijō, Kyoto Gyoen y compras locales",
    "dayType": "relaxed",
    "baseId": "kyoto",
    "notes": "Día más suave antes del cambio de base: Nijō opcional, Kyoto Gyoen, comercio local y segunda mano.",
    "keyNote": "Dejar espacio real para descanso y lavandería.",
    "paceNote": "Kyoto Gyoen y las calles locales no exigen entrada.",
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
        "title": "Kyoto Gyoen",
        "date": "2026-11-19",
        "category": "nature",
        "categories": [
          "nature",
          "culture"
        ],
        "location": {
          "name": "Kyoto Gyoen",
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
        "title": "Descanso y lavandería",
        "date": "2026-11-19",
        "category": "leisure",
        "categories": [
          "leisure"
        ],
        "location": {
          "name": "Descanso y lavandería",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
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
    "notes": "Senso-ji temprano, luego compras útiles en Kappabashi y vistas gratuitas hacia Skytree.",
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
    "notes": "Día festivo en Japón. Mirador metropolitano gratuito, Shinjuku y Kagurazaka.",
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
    "area": "Tokyo DisneySea · pendiente de comprar",
    "dayType": "theme-park",
    "baseId": "tokyo",
    "notes": "Día completo de DisneySea. Salida muy temprana desde Shiinamachi.",
    "reservationNote": "Entrada pendiente. Precio publicado de referencia en el documento: ¥10.900 adulto; confirmar al comprar.",
    "keyNote": "Comprar por canal oficial y usar la app para Premier Access/Standby según necesidad.",
    "paceNote": "Horario publicado de referencia: 09:00–21:00; verificar antes de ir.",
    "activities": [
      {
        "id": "jp-2026-11-24-disney-transfer",
        "title": "Shiinamachi → Maihama / DisneySea",
        "date": "2026-11-24",
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
        "id": "jp-2026-11-24-disneysea",
        "title": "Tokyo DisneySea",
        "date": "2026-11-24",
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
        "reservationId": "disneysea-2026-11-24"
      },
      {
        "id": "jp-2026-11-24-disney-return",
        "title": "Regreso a Shiinamachi",
        "date": "2026-11-24",
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
    "id": "jp-2026-day-2026-11-25",
    "date": "2026-11-25",
    "weekday": "Mié",
    "dayNumber": "25",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Meiji Jingu, Harajuku, Shibuya y Pokémon Center",
    "dayType": "standard",
    "baseId": "tokyo",
    "notes": "Ruta oeste entre dos días de parque: Meiji Jingu → Harajuku → Omotesando → Shibuya.",
    "keyNote": "Shibuya Sky sólo si se elige como observatorio pago principal.",
    "paceNote": "Regresar temprano para descansar antes de PokéPark; dejar compras grandes para el final del día.",
    "activities": [
      {
        "id": "jp-2026-11-25-meiji",
        "title": "Meiji Jingu",
        "date": "2026-11-25",
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
        "id": "jp-2026-11-25-harajuku",
        "title": "Harajuku",
        "date": "2026-11-25",
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
        "id": "jp-2026-11-25-omotesando",
        "title": "Omotesando",
        "date": "2026-11-25",
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
        "id": "jp-2026-11-25-shibuya",
        "title": "Shibuya Crossing + Hachiko",
        "date": "2026-11-25",
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
        "id": "jp-2026-11-25-pokemon",
        "title": "Pokémon Center Shibuya",
        "date": "2026-11-25",
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
        "id": "jp-2026-11-25-nintendo",
        "title": "Nintendo Tokyo",
        "date": "2026-11-25",
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
        "id": "jp-2026-11-25-shibuya-sky",
        "title": "Shibuya Sky",
        "date": "2026-11-25",
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
    "reservationNote": "Pokémon Forest: ventana de entrada 14:00–15:00. Sedge Town y Yomiuriland según condiciones y horario de operación.",
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
    "area": "Tokyo Tower exterior, Zojoji y Odaiba",
    "dayType": "relaxed",
    "baseId": "tokyo",
    "notes": "Fotos gratuitas de Tokyo Tower desde Zojoji/Shiba Park y tarde relajada por la bahía y Odaiba.",
    "keyNote": "No planear la estatua Unicorn Gundam: el documento indica que la exhibición terminó en agosto de 2026.",
    "paceNote": "Evitar pagar Main Deck si la prioridad es fotografiar la torre completa.",
    "activities": [
      {
        "id": "jp-2026-11-27-zojoji",
        "title": "Zojoji + Shiba Park",
        "date": "2026-11-27",
        "category": "temple",
        "categories": [
          "temple",
          "photography"
        ],
        "location": {
          "name": "Zojoji + Shiba Park",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-27-tower",
        "title": "Tokyo Tower · exterior",
        "date": "2026-11-27",
        "category": "photography",
        "categories": [
          "photography",
          "viewpoint"
        ],
        "location": {
          "name": "Tokyo Tower · exterior",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-27-odaiba",
        "title": "Bahía de Tokio + Rainbow Bridge + Odaiba",
        "date": "2026-11-27",
        "category": "leisure",
        "categories": [
          "leisure",
          "photography"
        ],
        "location": {
          "name": "Bahía de Tokio + Rainbow Bridge + Odaiba",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-27-malls",
        "title": "Centros comerciales de Odaiba",
        "date": "2026-11-27",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Centros comerciales de Odaiba",
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
    "id": "jp-2026-day-2026-11-28",
    "date": "2026-11-28",
    "weekday": "Sáb",
    "dayNumber": "28",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Nakano Broadway y Koenji",
    "dayType": "standard",
    "baseId": "tokyo",
    "notes": "Coleccionismo y objetos retro en Nakano; ropa y segunda mano en Koenji.",
    "keyNote": "Vintage no siempre significa barato.",
    "paceNote": "Revisar estado, etiquetas y políticas de devolución; llevar lista de deseos.",
    "activities": [
      {
        "id": "jp-2026-11-28-nakano",
        "title": "Nakano Broadway",
        "date": "2026-11-28",
        "category": "geek",
        "categories": [
          "geek",
          "shopping"
        ],
        "location": {
          "name": "Nakano Broadway",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-28-mandarake",
        "title": "Mandarake · Nakano",
        "date": "2026-11-28",
        "category": "shopping",
        "categories": [
          "shopping",
          "geek"
        ],
        "location": {
          "name": "Mandarake · Nakano",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-28-koenji",
        "title": "Koenji",
        "date": "2026-11-28",
        "category": "shopping",
        "categories": [
          "shopping",
          "culture"
        ],
        "location": {
          "name": "Koenji",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-28-2ndstreet",
        "title": "2nd STREET Koenji",
        "date": "2026-11-28",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "2nd STREET Koenji",
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
    "id": "jp-2026-day-2026-11-29",
    "date": "2026-11-29",
    "weekday": "Dom",
    "dayNumber": "29",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Día buffer: Yanaka/Nezu, Ikebukuro o compras finales",
    "dayType": "flexible",
    "baseId": "tokyo",
    "flexible": true,
    "notes": "Elegir según clima, cansancio y pendientes. Mantener este día sin excursión rígida.",
    "keyNote": "Comparar precios de souvenirs antes del aeropuerto.",
    "paceNote": "Priorizar lavandería, equipaje y pendientes reales.",
    "activities": [
      {
        "id": "jp-2026-11-29-yanaka-nezu",
        "title": "Yanaka / Nezu",
        "date": "2026-11-29",
        "category": "culture",
        "categories": [
          "culture",
          "photography"
        ],
        "location": {
          "name": "Yanaka / Nezu",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo",
        "optional": true
      },
      {
        "id": "jp-2026-11-29-ikebukuro",
        "title": "Ikebukuro",
        "date": "2026-11-29",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Ikebukuro",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo",
        "optional": true
      },
      {
        "id": "jp-2026-11-29-shopping",
        "title": "Compras finales",
        "date": "2026-11-29",
        "category": "shopping",
        "categories": [
          "shopping"
        ],
        "location": {
          "name": "Compras finales",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-29-laundry",
        "title": "Lavandería",
        "date": "2026-11-29",
        "category": "leisure",
        "categories": [
          "leisure"
        ],
        "location": {
          "name": "Lavandería",
          "address": null,
          "latitude": null,
          "longitude": null,
          "placeId": null
        },
        "city": "Tokyo"
      },
      {
        "id": "jp-2026-11-29-packing",
        "title": "Preparar equipaje",
        "date": "2026-11-29",
        "category": "travel",
        "categories": [
          "travel"
        ],
        "location": {
          "name": "Preparar equipaje",
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
    "id": "jp-2026-day-2026-11-30",
    "date": "2026-11-30",
    "weekday": "Lun",
    "dayNumber": "30",
    "month": "NOV",
    "city": "Tokyo",
    "area": "Salida · aeropuerto y reembolso tax-free",
    "dayType": "travel",
    "previousBaseId": "tokyo",
    "notes": "Día exclusivamente de salida. Confirmar aeropuerto, terminal, hora, equipaje y procedimiento tax-free.",
    "transportSummary": "Ruta al aeropuerto pendiente de confirmar cuando se valide el vuelo de salida.",
    "keyNote": "No deducir aeropuerto u hora de itinerarios anteriores.",
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
        "title": "Traslado al aeropuerto correspondiente",
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
  countdownDays: 28,
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
    "subtitle": "Jueves 12 nov · PROPUESTO",
    "date": "12 Nov 2026",
    "dateISO": "2026-11-12",
    "time": "",
    "status": "pending",
    "accent": "#df5753",
    "meta": "Entrada pendiente · comparar 12 vs 13 antes de comprar"
  },
  {
    "id": "disneysea-2026-11-24",
    "type": "ticket",
    "provider": "Tokyo Disney Resort",
    "code": "",
    "title": "Tokyo DisneySea",
    "subtitle": "Martes 24 nov · PROPUESTO",
    "date": "24 Nov 2026",
    "dateISO": "2026-11-24",
    "time": "",
    "status": "pending",
    "accent": "#df5753",
    "meta": "Entrada pendiente · comprar por canal oficial"
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
    updatedAt: "2026-10-14T15:01:00.000Z"
  }
};

assertTripTemplate(japan2026Trip);
assertJapan2026Baseline(japan2026Trip);
