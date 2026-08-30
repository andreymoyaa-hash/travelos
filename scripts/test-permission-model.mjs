import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  TRIP_PERMISSION_HEADING,
  canCreateTravelerSpaces,
  canManageReservations,
  canManagePlatformAccess,
  canManageTripParticipants,
  hasPermission,
  hasTripAccess,
  tripPermissionOptions,
  tripPermissionsOnly,
} from "../src/lib/permissions/permission-model.ts";

const platformAdmin = { manage_platform_access: true, create_traveler_spaces: true };
const normalOwner = {};
const mexicoOrganizer = { manage_trip_participants: true };
const companionPermissions = { edit_itinerary: true };

test("1. platform admin can access platform administration", () => {
  assert.equal(canManagePlatformAccess(platformAdmin), true);
  assert.equal(canCreateTravelerSpaces(platformAdmin), true);
});

test("2. a normal trip owner cannot create an independent traveler space", () => {
  assert.equal(canCreateTravelerSpaces(normalOwner), false);
});

test("3. a Mexico owner or authorized organizer can manage participants", () => {
  assert.equal(canManageTripParticipants("owner", normalOwner), true);
  assert.equal(canManageTripParticipants("editor", mexicoOrganizer), true);
});

test("4. a companion can be added only to the selected trip", () => {
  assert.equal(hasTripAccess("mexico", "mexico"), true);
  assert.equal(hasTripAccess("mexico", "japan"), false);
});

test("5. the companion can access Mexico", () => {
  assert.equal(hasTripAccess("mexico", "mexico"), true);
});

test("6. the companion cannot access Japan", () => {
  assert.equal(hasTripAccess("mexico", "japan"), false);
});

test("7. access to one trip does not grant access to a second trip", () => {
  assert.equal(hasTripAccess("mexico", "colombia"), false);
});

test("8. a companion cannot create an independent traveler space", () => {
  assert.equal(canCreateTravelerSpaces(companionPermissions), false);
});

test("9. a companion cannot grant platform permissions", () => {
  const filtered = tripPermissionsOnly({ ...companionPermissions, manage_platform_access: true });
  assert.equal("manage_platform_access" in filtered, false);
});

test("10. the trip permissions form cannot grant platform permissions", () => {
  const ids = tripPermissionOptions.map(({ id }) => id);
  assert.equal(ids.includes("manage_platform_access"), false);
  assert.equal(ids.includes("create_traveler_spaces"), false);
});

test("11. trip permission labels clearly state their scope", () => {
  assert.equal(TRIP_PERMISSION_HEADING, "PERMISOS EN ESTE VIAJE");
  assert.equal(tripPermissionOptions.every(({ description }) => description.toLowerCase().includes("este viaje") || description.toLowerCase().includes("personales")), true);
});

test("12. Part 1 private records remain participant-private", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260827205009_privacy_by_default_part1.sql", import.meta.url), "utf8");
  for (const policy of ["photos_private_select", "companion_progress_private_select", "stamp_unlocks_private_select", "expenses_private_or_shared_select"]) {
    assert.match(sql, new RegExp(`create policy ${policy}`));
  }
  assert.doesNotMatch(sql, /current_role\(\)\s*=\s*'owner'/i);
});

test("13. trip owners have no private-photo bypass", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260827205009_privacy_by_default_part1.sql", import.meta.url), "utf8");
  const photoBlock = sql.slice(sql.indexOf("create policy photos_private_select"), sql.indexOf("create policy photos_private_insert"));
  assert.match(photoBlock, /participant_id\s*=\s*app\.current_participant_id\(\)/);
  assert.doesNotMatch(photoBlock, /owner/i);
});

test("14. existing shared-trip collaboration remains enabled", () => {
  assert.equal(tripPermissionsOnly({ edit_itinerary: true }).edit_itinerary, true);
  assert.equal(tripPermissionsOnly({ manage_reservations: true }).manage_reservations, true);
});

test("database contract requires explicit platform permissions and disables plaintext PIN RPCs", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260827210000_platform_and_trip_permissions.sql", import.meta.url), "utf8");
  assert.match(sql, /app\.has_platform_permission\('manage_platform_access'\)/);
  assert.match(sql, /app\.is_platform_permission\(p_permission\)/);
  assert.match(sql, /revoke execute on function app\.generate_participant_pin/);
  assert.match(sql, /revoke execute on function app\.generate_guest_workspace_pin/);
});

test("edit itinerary does not grant reservation management", () => {
  assert.equal(canManageReservations("participant", {
    edit_itinerary: true,
    manage_reservations: false,
  }), false);
});

test("manage trip does not grant participant management", () => {
  assert.equal(canManageTripParticipants("editor", {
    manage_trip: true,
    manage_trip_participants: false,
  }), false);
});

test("owners receive recognized trip permissions", () => {
  assert.equal(hasPermission("owner", {}, "edit_itinerary"), true);
  assert.equal(hasPermission("owner", {}, "manage_reservations"), true);
});

test("owners do not receive unknown permissions", () => {
  assert.equal(hasPermission("owner", {}, "future_global_power"), false);
});

test("owners do not receive platform permissions without explicit keys", () => {
  assert.equal(hasPermission("owner", {}, "manage_platform_access"), false);
  assert.equal(hasPermission("owner", {}, "create_traveler_spaces"), false);
});

test("trip permission management strips every platform key", () => {
  const filtered = tripPermissionsOnly({
    manage_trip: true,
    manage_platform_access: true,
    create_traveler_spaces: true,
  });
  assert.deepEqual(Object.keys(filtered).sort(), [
    "create_stamps",
    "edit_itinerary",
    "import_pdf",
    "manage_reservations",
    "manage_trip",
    "manage_trip_participants",
  ]);
});

test("set trip participant permissions preserves created_by", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260827210000_platform_and_trip_permissions.sql", import.meta.url), "utf8");
  const functionBlock = sql.slice(
    sql.indexOf("create or replace function app.set_trip_participant_permissions"),
    sql.indexOf("create or replace function app.revoke_trip_participant_access"),
  );
  assert.match(functionBlock, /set permissions = app\.trip_permissions_only/);
  assert.doesNotMatch(functionBlock, /set[\s\S]*created_by\s*=/);
});

test("participants cannot promote themselves to owner", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260827210000_platform_and_trip_permissions.sql", import.meta.url), "utf8");
  const policyBlock = sql.slice(
    sql.indexOf("create policy participants_update"),
    sql.indexOf("create policy participants_delete"),
  );
  assert.match(policyBlock, /id <> app\.current_participant_id\(\)/);
  assert.match(policyBlock, /role <> 'owner'/);
});

test("database permission whitelist denies unknown owner permissions", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260827210000_platform_and_trip_permissions.sql", import.meta.url), "utf8");
  assert.match(sql, /create or replace function app\.is_trip_permission/);
  assert.match(sql, /when app\.is_trip_permission\(p_permission\)/);
  assert.match(sql, /else false/);
  assert.doesNotMatch(sql, /app\.has_permission\('manage_reservations'\)[\s\S]{0,80}app\.has_permission\('edit_itinerary'\)/);
  assert.doesNotMatch(sql, /app\.has_permission\('manage_trip_participants'\)[\s\S]{0,80}app\.has_permission\('manage_trip'\)/);
});
