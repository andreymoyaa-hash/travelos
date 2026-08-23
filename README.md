# Travel OS

Aplicación mobile-first para organizar el viaje **Japón 2026** de Andy y José: itinerario, presupuesto, reservas, mapa, ubicación, fotos y logros personales.

## Incluido en la actualización v1.1

- Participante activo intercambiable entre Andy y José.
- Gastos individuales o compartidos, pagador explícito y monedas JPY, CRC y USD.
- Presupuesto editable, categorías completas y totales pagados por participante.
- Datos reales vacíos al iniciar; fixtures de demostración aislados y no cargados.
- Itinerario completo del 9 al 30 de noviembre de 2026.
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

## Persistencia

Los cambios funcionales de esta versión viven durante la sesión del navegador. `src/services/travel-service.ts` mantiene el contrato para conectar almacenamiento durable, autenticación y sincronización sin reescribir las vistas.

La arquitectura completa está en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
