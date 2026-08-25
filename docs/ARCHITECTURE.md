# Travel OS — arquitectura multi-viaje

Travel OS usa Next.js App Router, React y TypeScript estricto. `page.tsx` continúa siendo un Server Component y entrega Japón 2026 como seed serializable a `TravelApp`. El shell cliente administra una colección de viajes independientes mediante un `tripId` estable.

## Límite de dominio

```text
TravelApp
  └─ TripRepository
       ├─ LocalTripRepository (activo)
       └─ CloudTripRepository (contrato futuro)

Trip (tripId)
  ├─ participantes
  ├─ días / actividades / lugares
  ├─ reservas / gastos
  ├─ fotos / TravelMemory
  ├─ PassportTemplate / stamps
  └─ CompanionProfile / progreso
```

Los componentes no acceden a `localStorage`. Todas las lecturas, escrituras, altas, cambios y eliminaciones pasan por `TripRepository`, ubicado en `src/repositories/trip-repository.ts`. La implementación local usa un sobre versionado (`travel-os:trips:v2`) y permite sustituir el almacenamiento sin reescribir las vistas.

## Migración y snapshot de Japón

- `LocalTripRepository` migra de forma idempotente claves legacy conocidas y asigna datos sin ID a `japan-2026`.
- El seed Japón se inserta sólo si no existe; nunca se duplica.
- `japan-2026-baseline.ts` comprueba en ejecución 22 días, 143 actividades, 3 bases, 2 vuelos, 17 sellos, Andy/José y la dirección real de Osaka.
- `validate-trip.ts` conserva las invariantes de fechas e IDs únicos.
- Japón 2026 está marcado como protegido y no puede eliminarse desde la interfaz.

## CountryTheme

`CountryTheme` ya no cambia una bandera sobre el viaje activo. El tema se resuelve desde `activeTrip.countryId` y define país, paleta, acento tipográfico, patrones, estilo decorativo, tratamiento de iconos, pasaporte, companion y etiquetas. Se implementan:

- Japón: conserva Sumi, Washi, Torii, Aizome, Matcha, Sakura y Kin.
- México: geometría urbana, azulejos y papel picado abstracto; no usa torii, sakura ni señalización japonesa.
- Internacional: fallback neutral para otros destinos.

## PassportTemplate y CompanionProfile

Cada viaje selecciona su `PassportTemplate` al crearse. Japón conserva sus 17 sellos reales; México y el fallback internacional reciben únicamente sus plantillas propias y admiten sellos personalizados. Los desbloqueos, fotografías y fechas viven dentro del `Trip` activo.

`CompanionProfile` elige Pikachu sólo para Japón/Geek Mode y un companion Travel OS neutral para los demás países. `CompanionProgress` persiste nivel, XP, mood, último mensaje e interacción por viaje.

## Fotos y recuerdos

`TravelPhoto` mantiene compatibilidad con las fotos existentes y agrega `tripId`, día, actividad, lugar, sello y nota opcionales. `TravelMemory` representa el modelo de dominio de la siguiente migración. La cámara abre una revisión modal/full-screen inmediata; al cerrar no navega ni modifica el scroll del módulo de origen.

## Local Mode y Cloud Mode

Local Mode funciona hoy sin cuentas ni backend: multi-viaje, edición, cámara, mapas, Passport y companion persisten en el navegador. Las imágenes siguen siendo data URLs; un volumen grande puede alcanzar la cuota del navegador y deberá migrarse a object storage.

Cloud Mode es una base preparada, no una función simulada. El esquema propuesto está en `supabase/migrations/202608250001_travel_os_foundation.sql` y contempla usuarios, viajes, miembros, días, actividades, ubicaciones, reservas, gastos, fotos, sellos, desbloqueos, progreso e invitaciones. La UI informa que compartir requiere configurar Supabase y no genera enlaces falsos.

Variables requeridas para implementar Cloud Mode:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Todavía falta instalar un cliente Supabase, implementar autenticación, `CloudTripRepository`, storage de fotos, aceptación de invitaciones y pruebas de permisos/RLS. La ausencia de esas variables no afecta Local Mode.

## Google Maps

El mapa mantiene lazy loading cliente, Places API (New), Advanced Markers, GPS consentido, enlaces a Google Maps y `Route.computeRoutes`. Transit solicita `travelAdvisory` y lee `route.travelAdvisory?.transitFare`; nunca inventa tarifas. La opción “Más barato” sólo compara rutas con tarifas suficientes.
