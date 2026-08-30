# Google Maps Platform en NIOLI

## APIs y credenciales

NIOLI usa una API key de navegador en `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` y, opcionalmente, un Cloud Map ID en `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.

Activa en el mismo proyecto de Google Cloud:

- **Maps JavaScript API** para el mapa, Advanced Markers y la carga dinámica de bibliotecas.
- **Places API (New)** para `PlaceAutocompleteElement` y los campos verificables `id`, nombre, dirección y coordenadas.
- **Routes API** para la biblioteca Routes de JavaScript y `Route.computeRoutes`.

Geocoding API no es necesaria para el flujo actual porque el usuario elige un resultado de Places. Sólo debería activarse si en el futuro se implementa geocodificación directa de direcciones.

## Restricciones recomendadas

La variable empieza por `NEXT_PUBLIC_` porque el navegador debe enviar la key a Google Maps. Nunca uses una key de servidor sin restricciones en esta variable.

1. Aplica restricción de aplicación **Websites (HTTP referrers)**.
2. Añade los orígenes exactos utilizados, por ejemplo `http://localhost:3000/*`, el dominio de preview autorizado y el dominio de producción.
3. Aplica restricciones de API a **Maps JavaScript API**, **Places API (New)** y **Routes API**.
4. Usa keys separadas para clientes web y cualquier backend futuro.
5. Configura cuotas y alertas de presupuesto. Rota la key si aparece en una ubicación no autorizada.

## Comportamiento de la aplicación

- Las bibliotecas se descargan sólo al abrir Mapa; `routes` se importa aún más tarde, al calcular una ruta.
- La geolocalización se solicita únicamente al pulsar **Usar mi ubicación**.
- Un lugar seleccionado conserva nombre, dirección, coordenadas y `placeId` y queda disponible durante la sesión.
- **Más rápida** selecciona la menor duración devuelta.
- **Más barata** sólo compara si todas las alternativas relevantes incluyen una tarifa real en la misma moneda; de lo contrario usa la más rápida y comunica la falta de datos.
- **Menos caminata** compara la distancia real de los segmentos a pie y solicita `LESS_WALKING` cuando está disponible.
- Tiempo, distancia, transbordos, tarifa y caminata nunca se inventan. Los datos ausentes se muestran como no disponibles.
- **Abrir en Google Maps** usa la URL universal de direcciones con el origen consentido y el destino elegido.

Sin API key se muestra un estado de configuración pendiente. Ese estado no bloquea GPS, itinerario, reservas, fotos, logros ni finanzas.
