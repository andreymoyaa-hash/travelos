# NIOLI — multi-trip architecture

NIOLI uses Next.js App Router, React, strict TypeScript, a repository boundary, and a real Supabase backend. `page.tsx` remains a Server Component: it decides whether Supabase is configured and passes only serializable configuration/seed data to the client login gate.

## Access boundary

When Supabase is configured, the first screen is always the six-digit PIN gate. The PIN is sent only to the server route and then to the Supabase `access-login` Edge Function. It is never stored in localStorage, sessionStorage, IndexedDB, cookies, or application logs.

Successful access returns one of two server-authorized session types:

```text
PIN
├─ trip session      → one participant + one trip
└─ guest workspace   → isolated list of workspace_trips
                         └─ open/create issues a scoped trip session
```

Tokens live in HTTP-only, same-site cookies. Data requests use `x-travel-session`; guest workspace RPCs use `x-workspace-session`. User-supplied trip IDs never decide authorization. A missing or expired `/api/travel-session` is represented as HTTP 204 and is a normal signed-out state, not a login error.

## Domain and persistence

```text
TravelApp
  └─ TripRepository
       ├─ LocalTripRepository
       └─ CloudTripRepository

Trip (stable tripId)
  ├─ participants
  ├─ PlannedData: days, activities, bases, reservations, places
  ├─ LiveData: expenses, photos/memories, unlocked stamps, XP
  ├─ PassportTemplate / achievements
  └─ CompanionProfile / progress
```

Local Mode uses the versioned `travel-os:trips:v2` store behind `LocalTripRepository`. Cloud Mode uses Supabase as primary storage and keeps a trip-scoped browser backup only as outage protection. Components do not query protected access/session tables or store a PIN.

## Japan 2026 preservation

- The local migration assigns legacy data without a `tripId` to `japan-2026` idempotently.
- The remote migration runs only for the owner and only when the remote trip has no days.
- `japan-2026-baseline.ts` checks 22 unique days, 143 activities, three bases, two flights, 17 stamps, Andy/José, and the known Osaka address.
- Japan is protected from local deletion.

## CountryExperience and NIOLI

`CountryExperience` resolves the theme, Passport template, Brady profile, ISO country code, and a production-safe NIOLI Country Pack. JP, MX, CO, US, ES, CL, AR, KR, and CR have explicit themes; unknown countries use the international fallback and never borrow Japan.

Country artwork must pass `docs/NIOLI_ASSET_VISUAL_QA.md`. Main UI code reads `getProductionReadyCountryAssetPack`; a blocking asset becomes `null` and falls back to the existing CSS/text treatment or a transparent Brady core action. Reference boards remain under `/public/nioli/refs` and are QA-only.

## Passport, Brady, photos, and memories

Each trip owns its Passport template, stamps, unlocks, photos, and Brady progress. Photo capture uses an immediate review modal/full-screen layout with note/day/activity/place/stamp associations. GPS is requested only after an explicit user action. Cloud photos use the required `{tripId}/{participantId}/{filename}` Storage path.

## Legacy Travel OS PDF Standard

The itinerary screen implements the complete local pipeline:

```text
PDF → parse (PDF.js) → preview → validate → normalize → merge PlannedData
```

For backward compatibility, the internal wire format still accepts the legacy declaration `TRAVEL OS PDF STANDARD` and markers `BEGIN_TRAVEL_OS_JSON` / `END_TRAVEL_OS_JSON`. New public-facing documents may declare `NIOLI PDF STANDARD`; both names resolve to the same version 1 format with `plannedData.days`, `plannedData.reservations`, and `plannedData.bases`.

Importing merges by stable ID/date and never deletes or replaces LiveData: photos, expenses, unlocked stamps, XP, memories, participants, and companion progress remain untouched. Cloud users also require the applicable itinerary and PDF permissions.

## Map providers

- `google`: lazy Maps JavaScript API, Places (New), Advanced Markers, explicit GPS, Google Maps links, and `Route.computeRoutes`.
- `open`: lazy OpenStreetMap embed and explicit GPS without pretending that Places or Routes are available.

Transit requests ask for `travelAdvisory` and then read `route.travelAdvisory?.transitFare`. “Más barato” compares only compatible fares actually returned by Google; “Menos caminata” uses transit `LESS_WALKING` and real leg steps.

## Environment variables

```dotenv
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Real values belong only in ignored local/Vercel environment configuration. The service-role key is never present in frontend files or bundles.
