NIOLI OFFICIAL ASSETS IMPLEMENTATION — 2026-08-28

BASELINE: NIOLI-current.zip supplied by user.

INCLUDES
- BRADY LOCK implementation: master + JP/CO/MX/KR/US official raster assets.
- SELLOS LOCK: 100 individual PNG stamps (20 per country) with locked/unlocked UI states handled in code.
- RUTA LOCK: route-memory artwork for JP/CO/MX/KR/US and reusable route ticket component.
- Passport catalogs for JP/CO/MX/KR/US.
- Dashboard, Passport, login and navigation integration.
- App-level catalog migration logic only; NO Supabase migration/write.

IMPORTANT
- Do not regenerate or redraw Brady.
- Do not put Brady inside stamps.
- Do not replace official raster assets with AI redraws.
- Do not apply sepia/yellow filters.
- Do not apply Supabase migrations for this package.
- Validate locally before production deployment.

VALIDATION ALREADY PERFORMED IN SANDBOX
- Official asset tests: PASS
- Visual System V2 tests: PASS
- Passport V2 tests: PASS
- Existing Passport catalog tests: PASS
- Modified TS/TSX syntax/transpile check: PASS

FULL pnpm TypeScript/ESLint/Next build must be run on the user's local repo because this sandbox does not have the project's complete node_modules.
