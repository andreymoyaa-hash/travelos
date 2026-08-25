# Travel OS

Plataforma mobile-first para organizar múltiples viajes independientes. **Japón 2026** de Andy y José permanece como el primer viaje real y protegido del sistema.

## Incluido

- Participante activo intercambiable entre Andy y José.
- Gastos individuales o compartidos, pagador explícito y monedas JPY, CRC y USD.
- Presupuesto editable, categorías completas y totales pagados por participante.
- Datos reales vacíos al iniciar; fixtures de demostración aislados y no cargados.
- Itinerario maestro editable con los 22 días del 9 al 30 de noviembre de 2026.
- Bases Osaka → Kyoto → Tokyo, vuelos de ida enriquecidos y reloj mundial en tiempo real con zonas horarias legibles.
- Edición de días, actividades, alojamientos, horarios, notas, costos y vínculos a reservas.
- Reordenamiento y traslado de actividades e intercambio de planes con control explícito de reservas vinculadas.
- Geolocalización consentida con coordenadas, precisión y disparadores de logros cercanos.
- Cámara del navegador, fotos geolocalizadas, vínculo con logros y álbum por participante.
- 17 logros agrupados con desbloqueo independiente, manual, por foto o preparado por GPS.
- Google Maps Platform con Maps JavaScript API, Places API (New), rutas reales, lugares guardados y fallback seguro cuando falta configuración.
- Sistema visual Japan 2026 con tokens Washi, Sumi, Torii, Indigo, Matcha, Sakura y Kin; layout responsive desde 320 px.
- Pantalla **Mis viajes**, creación/edición/cambio de viaje y persistencia local mediante `TripRepository`.
- Tema México propio, sin datos ni decoración japonesa, y fallback internacional.
- Travel Passport V2 por viaje, sellos personalizados, detalle, fotos, fecha, GPS/manual y XP.
- Companion V2 por viaje; Pikachu sólo en Japón y companion Travel OS neutral para otros destinos.
- Revisión de cámara inmediata con nota y asociaciones a día, actividad, lugar o sello.

## Ejecutar localmente

Requisitos: Node.js 20.9 o superior y pnpm.

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). La cámara y la ubicación requieren permiso del navegador; fuera de `localhost`, normalmente también requieren HTTPS.

## Configurar Google Maps

1. En Google Cloud habilita **Maps JavaScript API**, **Places API (New)** y **Routes API** en un proyecto con facturación activa.
2. Crea una API key para navegador y restríngela por los referrers HTTP exactos de desarrollo y producción.
3. Restringe esa key para que sólo pueda usar las tres APIs anteriores.
4. Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_key_restringida
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=tu_map_id_opcional
```

Reinicia `pnpm dev` después de cambiar variables. La key de navegador es pública por naturaleza: su protección depende de las restricciones de sitio y API, no de ocultarla en el bundle. Sin key, Travel OS muestra un estado de configuración pendiente y conserva operativos itinerario, GPS, reservas, fotos y finanzas.

Consulta [docs/GOOGLE_MAPS.md](docs/GOOGLE_MAPS.md) para la lista completa de APIs, restricciones y comportamiento de rutas.

## Validación

```bash
pnpm typecheck
pnpm lint
pnpm build
node scripts/visual-check.mjs
```

La prueba de navegador usa Chrome instalado localmente, recorre los flujos principales, valida anchos 320/375/390/430 px y guarda capturas responsive en `artifacts/`. Sin una key local, verifica explícitamente el fallback de Google Maps; las respuestas reales de Places y Routes requieren una key válida.

## Crear y editar viajes

La plantilla de Japón vive en `src/data/trips/japan-2026.ts`, fuera de los componentes React. Para ajustar el plan inicial, edita sus `bases`, `flightSegments` o `itinerary`; los IDs de días y actividades deben mantenerse únicos y las coordenadas no verificadas deben seguir como `null`.

Durante una sesión, abre **Itinerario** para editar días, alojamientos y actividades, o para mover e intercambiar planes. Abre **Reservas** para registrar una reserva independiente y después vincúlala desde el editor de una actividad o alojamiento. Al mover contenido vinculado, Travel OS pregunta si también debe mover la fecha de la reserva.

Abre **Mis viajes** y usa **Crear viaje**. El formulario solicita nombre, país, ciudad opcional, fechas, moneda, zona horaria, participantes y creador. El viaje recibe un `tripId` estable y comienza sin datos de Japón. Puedes volver a Mis viajes desde la navegación lateral o pulsando el viaje activo en la barra superior.

## Persistencia

Los cambios se guardan en `localStorage` detrás de `LocalTripRepository`; los componentes no dependen directamente del mecanismo. `.env.example` incluye placeholders vacíos para Supabase, pero compartir entre dispositivos todavía requiere implementar y configurar Cloud Mode. La app no simula invitaciones.

La arquitectura completa está en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
