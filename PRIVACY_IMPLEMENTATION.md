# NIOLI privacy sprint recovery

This recovery targets NIOLI's current custom PIN/session backend. It does not
introduce `users`, `trip_members`, JWT workspace claims, or a second auth model.

## Migration status

### Part 1 — participant-private RLS

`supabase/migrations/20260827205009_privacy_by_default_part1.sql` is the focused
RLS migration for:

- `photos`
- `expenses`
- `stamp_unlocks`
- `companion_progress`

Photos, stamp unlocks, and companion progress are visible and writable only
when `participant_id = app.current_participant_id()` and the row belongs to the
current trip. Expenses are visible when owned by the current participant or
when explicitly shared inside the current trip; writes remain owner-only.
There is no trip-owner bypass for another participant's private records.

The existing trip-level policies for `trips`, `trip_days`, `activities`,
`locations`, `reservations`, and `passport_stamps` are intentionally unchanged.

### Part 2 — one-time private invitations (Privacy Sprint 2)

The complete implementation is
`supabase/migrations/20260827220000_private_access_invitations.sql`, after the
Permission Sprint. The obsolete, never-applied `202608270002` draft was removed
from the executable migrations directory. The active migration:

- adds one invitation model for trip companions and independent travelers;
- stores only SHA-256 token digests and returns each raw token once;
- authorizes companion creation with `can_manage_trip_participants()`;
- authorizes independent creation with explicit `create_traveler_spaces`;
- lets the invitee choose a non-trivial six-digit PIN;
- stores only salted bcrypt PIN hashes in the existing access tables;
- makes setup tokens single-use and expiring;
- disables the legacy owner-facing plaintext guest-PIN RPCs;
- revokes prior trip/workspace sessions as soon as a reset is issued;
- limits inviter metadata to display name, status, expiry, and completion.

Apply Part 2 only after the Permission Sprint migration and deploy the matching
API/UI in the same reviewed release. No migration in this repository has been
applied by this implementation task.

The production sequence is:

1. `20260827205009_privacy_by_default_part1.sql` (already live)
2. `20260827210000_platform_and_trip_permissions.sql`
3. `20260827220000_private_access_invitations.sql`

Invitation URLs carry their one-time token in `/setup#token=...`. The setup
page removes the fragment immediately, retains the token in memory only, and
sends it to the setup API exclusively in POST JSON bodies.

## Guest isolation

The existing architecture remains authoritative:

- workspace authentication uses `guest_workspace_sessions` and the
  `x-workspace-session` header;
- `app.current_guest_workspace_id()` identifies only the current workspace;
- `workspace_trips` scopes trip listing/opening to that workspace;
- opening a workspace trip creates a normal `pin_sessions` token for only that
  linked trip;
- normal trip RLS uses `app.current_trip_id()`, so an inviter's Japan 2026
  session does not reveal a guest trip and a guest cannot open Japan 2026.

The inviter metadata RPC does not return trip names, trip count, trip content,
photos, expenses, memories, or stamps.

## Tests

The three TypeScript privacy harnesses use the same untyped `SupabaseClient`
convention as the application. They require disposable QA fixtures and scoped
session tokens; they never use a service-role key because that would bypass RLS.

The 14 scenarios cover participant privacy, shared expenses, denied owner
mutations, cross-workspace isolation, Japan 2026 isolation, inviter visibility,
PIN-hash secrecy, one-use/expired setup tokens, and session revocation on reset.

No migration in this recovery has been applied to the live Supabase project.
