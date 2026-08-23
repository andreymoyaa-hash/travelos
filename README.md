# Travel OS

Aplicación mobile-first para organizar el viaje **Japón 2026** de Andy y José: itinerario, presupuesto, reservas, mapa, ubicación, fotos y logros personales.

## Incluido

- Participante activo intercambiable entre Andy y José.
- Gastos individuales o compartidos, pagador explícito y monedas JPY, CRC y USD.
- Presupuesto editable, categorías completas y totales pagados por participante.
- Datos reales vacíos al iniciar; fixtures de demostración aislados y no cargados.
- Itinerario maestro editable con los 22 días del 9 al 30 de noviembre de 2026.
- Bases Osaka → Kyoto → Tokyo, vuelos de ida con zonas horarias y ubicaciones preparadas para Google Places.
- Edición de días, actividades, alojamientos, horarios, notas, costos y vínculos a reservas.
- Reordenamiento y traslado de actividades e intercambio de planes con control explícito de reservas vinculadas.
- Geolocalización consentida con coordenadas, precisión y disparadores de logros cercanos.
- Cámara del navegador, fotos geolocalizadas, vínculo con logros y álbum por participante.
- 17 logros agrupados con desbloqueo independiente, manual, por foto o preparado por GPS.
- Mapa Leaflet con teselas de OpenStreetMap y modos de ruta sin estimaciones inventadas.
- Layout responsive con navegación lateral y barra móvil.

## Ejecutar localmente

Requisitos: Node.js 20.9 o superior y pnpm.

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). La cámara y la ubicación requieren permiso del navegador; fuera de `localhost`, normalmente también requieren HTTPS.

## Validación

```bash
pnpm typecheck
pnpm lint
pnpm build
node scripts/visual-check.mjs
```

La prueba de navegador usa Chrome instalado localmente, recorre los flujos principales y guarda capturas responsive en `artifacts/`.

## Editar viajes y reservas

La plantilla de Japón vive en `src/data/trips/japan-2026.ts`, fuera de los componentes React. Para ajustar el plan inicial, edita sus `bases`, `flightSegments` o `itinerary`; los IDs de días y actividades deben mantenerse únicos y las coordenadas no verificadas deben seguir como `null`.

Durante una sesión, abre **Itinerario** para editar días, alojamientos y actividades, o para mover e intercambiar planes. Abre **Reservas** para registrar una reserva independiente y después vincúlala desde el editor de una actividad o alojamiento. Al mover contenido vinculado, Travel OS pregunta si también debe mover la fecha de la reserva.

Para añadir otro viaje, crea un módulo en `src/data/trips/` que exporte un objeto `Trip`, valida su rango con `assertTripTemplate` y entrégalo a `TravelApp` desde la ruta correspondiente. Los componentes no requieren cambios para leer la misma estructura.

## Persistencia

Los cambios realizados desde la interfaz viven durante la sesión del navegador. `src/services/travel-service.ts` mantiene el contrato para conectar almacenamiento durable, autenticación y sincronización sin reescribir las vistas.

La arquitectura completa está en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
