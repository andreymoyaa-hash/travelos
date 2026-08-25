# Travel OS — arquitectura

Travel OS usa Next.js App Router, React, TypeScript estricto y Tailwind CSS. `page.tsx` permanece como Server Component y entrega una plantilla serializable al shell cliente `TravelApp`, que coordina el estado temporal de la sesión.

## Estructura

```text
src/
  app/                  # layout, metadata, errores y entrada RSC
  components/           # navegación, tarjetas y primitivas visuales
  data/
    trips/
      japan-2026.ts     # plantilla maestra: bases, vuelos y 22 días
      validate-trip.ts  # invariantes de fechas e IDs estables
    japan-trip.ts       # reexportación de compatibilidad
    japan-itinerary.ts  # reexportación de compatibilidad
    japan-achievements.ts
    japan-demo-data.ts  # fixtures opcionales, nunca cargados por el viaje real
  features/
    trips/              # estado compartido y participante activo
    dashboard/          # resumen personal del viaje
    itinerary/          # edición, reordenamiento y traslado del plan
    expenses/           # presupuesto, monedas, categorías y pagadores
    reservations/       # reservas y estado vacío
    maps/               # Google Maps, Places New, Routes y geolocalización consentida
    photos/             # captura MediaDevices y metadatos
    achievements/       # logros por persona y álbum
  services/             # contrato para persistencia futura
  types/                # modelos de dominio compartidos
```

## Decisiones clave

- **Datos reales y demo separados:** el viaje real no importa los fixtures de demostración.
- **Viajes como datos:** la UI consume `Trip`; ningún día o vuelo vive dentro de componentes React.
- **Referencias estables:** días y actividades tienen IDs propios; `reservationId` y `stampId` son referencias opcionales.
- **Ubicaciones verificables:** nombre y dirección conviven con latitud, longitud y `placeId`; las coordenadas desconocidas son `null`.
- **Movimientos explícitos:** intercambiar planes conserva las fechas/base logísticas y vuelve a fechar actividades; las reservas sólo cambian cuando el usuario lo acepta.
- **Identidad por participante:** gastos usan `paidBy` y `scope`; logros usan `unlockedBy`; fotos usan `participantId`.
- **Sin conversiones falsas:** cada gasto conserva su moneda y el presupuesto sólo se compara con gastos de la misma moneda.
- **Permisos bajo acción explícita:** Geolocation se solicita desde “Usar mi ubicación” y MediaDevices desde “Tomar foto”.
- **Google Maps cliente aislado:** el mapa se carga dinámicamente sin SSR y las bibliotecas `maps`, `marker` y `places` sólo se importan al abrir la vista.
- **Servicios actuales:** Places usa `PlaceAutocompleteElement`; Routes usa `Route.computeRoutes`, sin `DirectionsService` ni respuestas simuladas.
- **Costo honesto:** la opción más barata sólo compara alternativas cuando Google devuelve tarifas reales comparables; si no, explica la limitación. La caminata y los transbordos también muestran “No disponible” cuando faltan datos.
- **Reloj reutilizable:** cada `Trip` declara origen, destino y zonas IANA; `Intl.DateTimeFormat` calcula fecha, hora y cambios de horario sin offsets fijos.
- **Tema por país:** `CountryTheme` concentra tokens de color y semántica de rutas para evitar valores Japón-específicos dentro de componentes compartidos.
- **Desbloqueo extensible:** los logros declaran métodos `manual`, `photo` y `gps`, además de radios geográficos opcionales.
- **Persistencia sustituible:** `TravelService` define el límite para base de datos, almacenamiento de imágenes y sincronización.

## Pendiente de infraestructura

1. Implementar `TravelService` con autenticación y base de datos.
2. Mover fotografías de data URLs de sesión a almacenamiento de objetos.
3. Persistir los lugares de Google Places guardados durante la sesión mediante `TravelService`.
4. Añadir caché offline de documentos respetando las políticas de Google Maps Platform; no almacenar contenido prohibido del proveedor.
