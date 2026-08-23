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
    maps/               # geolocalización y mapa Leaflet/OpenStreetMap
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
- **Mapa cliente aislado:** Leaflet se carga dinámicamente sin SSR; OpenStreetMap mantiene atribución visible y no se precargan teselas.
- **Desbloqueo extensible:** los logros declaran métodos `manual`, `photo` y `gps`, además de radios geográficos opcionales.
- **Persistencia sustituible:** `TravelService` define el límite para base de datos, almacenamiento de imágenes y sincronización.

## Pendiente de infraestructura

1. Implementar `TravelService` con autenticación y base de datos.
2. Mover fotografías de data URLs de sesión a almacenamiento de objetos.
3. Conectar un proveedor de geocodificación y rutas para duración, costo y navegación guiada.
4. Añadir caché offline de documentos respetando las políticas del proveedor de mapas.
