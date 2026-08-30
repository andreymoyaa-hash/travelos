NIOLI — ChatGPT implementation patch

Purpose
- Strict PIN on every fresh app start / no silent previous-user restore.
- "Cambiar usuario" clears all browser/server access context.
- Bounded Cloud trip loading to avoid infinite "Cargando tu viaje".
- Official NIOLI login/setup colors (#2E4A3A / #8B5E34 / #F8F0E7).
- Brady welcome transition after PIN.
- NIOLI loading animation with a small airplane orbit and reduced-motion support.
- Country UI palettes refined for JP, MX, CO, US, ES, CL, AR, KR, CR.
- Country-specific in-app NIOLI logo/seal variants derived from the approved canonical assets.
- Official favicon/PWA/login assets remain unchanged and global.
- Unknown country uses INTERNATIONAL / official NIOLI, never Japan.
- Add Companion modal uses dynamic viewport scrolling and aligned permission controls.

Important
- The seven canonical files in public/brand/ were NOT modified.
- Country variants are derivative display assets only; no Brady redraw was performed.
- No database migration is included in this patch.
- No Supabase write/deploy was performed.
- Permanent hard-delete is intentionally NOT included here because live schema audit shows photos/expenses and Storage require a separate deletion/storage-cleanup design. Do not fake hard-delete until that is handled safely.

Validation performed in sandbox
- Branding + experience static tests: 11/11 PASS.
- Invitation/security tests: 39/39 PASS.
- Permission tests: 24/24 PASS (Node experimental TS stripping used in sandbox).
- TypeScript syntax transpile of all modified TS/TSX files: PASS.
- Full Next/ESLint/typecheck could not be executed in sandbox because node_modules were intentionally excluded and network package installation is unavailable. Run them locally before deploy.

Codex role
- Do NOT rewrite or redesign this patch.
- Validate locally with the existing project dependencies.
- If validation passes, deploy only.
