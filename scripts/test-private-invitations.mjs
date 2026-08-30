import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const migrationPath = new URL("../supabase/migrations/20260827220000_private_access_invitations.sql", import.meta.url);
const part1Path = new URL("../supabase/migrations/20260827205009_privacy_by_default_part1.sql", import.meta.url);
const apiPath = new URL("../src/app/api/travel-access/route.ts", import.meta.url);
const setupApiPath = new URL("../src/app/api/travel-setup/route.ts", import.meta.url);
const setupUiPath = new URL("../src/features/auth/setup-access-view.tsx", import.meta.url);
const sharingPath = new URL("../src/lib/invitations/invitation-sharing.ts", import.meta.url);
const setupPagePath = new URL("../src/app/setup/page.tsx", import.meta.url);
const nextConfigPath = new URL("../next.config.ts", import.meta.url);
const accessViewPath = new URL("../src/features/access/access-manager-view.tsx", import.meta.url);
const migrationsDirectory = new URL("../supabase/migrations/", import.meta.url);

const [sql, part1, api, setupApi, setupUi, sharingSource, setupPage, nextConfig, accessView, migrationFiles] = await Promise.all([
  readFile(migrationPath, "utf8"),
  readFile(part1Path, "utf8"),
  readFile(apiPath, "utf8"),
  readFile(setupApiPath, "utf8"),
  readFile(setupUiPath, "utf8"),
  readFile(sharingPath, "utf8"),
  readFile(setupPagePath, "utf8"),
  readFile(nextConfigPath, "utf8"),
  readFile(accessViewPath, "utf8"),
  readdir(migrationsDirectory),
]);

const transpiledSharing = ts.transpileModule(sharingSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sharing = await import(`data:text/javascript;base64,${Buffer.from(transpiledSharing).toString("base64")}`);

test("1 companion invitations require trip participant management", () => {
  assert.match(sql, /not app\.can_manage_trip_participants\(\)/);
});
test("2 companion invitations bind to the current trip", () => {
  assert.match(sql, /v_trip_id uuid := app\.current_trip_id\(\)/);
  assert.match(sql, /'trip_companion'.*v_trip_id, v_participant_id, v_trip_access_id/s);
});
test("3 platform keys cannot enter companion permissions", () => {
  assert.match(sql, /not app\.is_trip_permission\(supplied\.permission_key\)/);
});
test("4 invitation cannot promote a companion to owner", () => {
  assert.match(sql, /values \(v_trip_id, trim\(p_display_name\), 'participant'\)/);
  assert.doesNotMatch(sql, /p_role/);
});
test("5 companion target identity is trip-specific", () => {
  assert.match(sql, /target_trip_id, target_participant_id, target_trip_access_id/);
  assert.match(sql, /p\.trip_id = v_invitation\.target_trip_id/);
});
test("6 companion invitation creates no independent workspace", () => {
  assert.match(sql, /invitation_type = 'trip_companion'[\s\S]*target_workspace_id is null/);
});
test("7 only a SHA-256 token digest is persisted", () => {
  assert.match(sql, /token_hash bytea not null unique/);
  assert.match(sql, /extensions\.digest\(v_setup_token, 'sha256'\)/);
  assert.doesNotMatch(sql, /setup_token text\s*(not null|unique)/i);
});
test("8 token redemption locks its row", () => assert.match(sql, /for update;/));
test("9 replay is rejected after consumption", () => {
  assert.match(sql, /consumed_at is not null then raise exception 'setup_token_used'/);
  assert.match(sql, /asi\.consumed_at is null and asi\.revoked_at is null/);
});
test("10 expired tokens fail", () => assert.match(sql, /expires_at <= now\(\).*setup_token_expired/s));
test("11 revoked tokens fail", () => assert.match(sql, /revoked_at is not null.*setup_token_revoked/s));
test("12 PIN format is exactly six digits", () => assert.match(sql, /p_pin !~ '\^\[0-9\]\{6\}\$'/));
test("13 weak PINs are rejected", () => {
  assert.match(sql, /'000000'/);
  assert.match(sql, /'123456'/);
  assert.match(sql, /raise exception 'weak_pin'/);
});
test("14 global PIN collision helper is used for both access kinds", () => {
  assert.equal((sql.match(/app\.pin_exists_anywhere\(/g) ?? []).length, 2);
});
test("15 inviter response exposes a URL but no PIN", () => {
  assert.match(api, /setupUrl: setupUrl\(request, row\.setup_token\)/);
  assert.doesNotMatch(api, /pin:\s*row\./);
});
test("16 setup completion response exposes no PIN hash", () => {
  assert.doesNotMatch(setupApi, /pin_hash/);
  assert.match(setupApi, /activated: true/);
});
test("17 reset revokes prior sessions", () => {
  assert.match(sql, /issue_trip_companion_pin_reset[\s\S]*update public\.pin_sessions/s);
  assert.match(sql, /issue_independent_traveler_pin_reset[\s\S]*update public\.guest_workspace_sessions/s);
});
test("18 reset returns only one-time setup material", () => {
  assert.match(sql, /returns table\(setup_token text, setup_expires_at timestamptz\)/);
  assert.doesNotMatch(sql, /returns table\([^)]*(old_pin|new_pin|pin_hash)/i);
});
test("19 independent traveler creation requires explicit platform permission", () => {
  assert.match(sql, /has_platform_permission\('create_traveler_spaces'\)/);
});
test("20 normal trip ownership is insufficient for traveler spaces", () => {
  const independent = sql.slice(sql.indexOf("app.issue_independent_traveler_invitation"), sql.indexOf("app.issue_trip_companion_pin_reset"));
  assert.doesNotMatch(independent, /current_role\(\).*owner/);
});
test("21 independent traveler inherits no trip or platform permission", () => {
  assert.match(sql, /'independent_traveler', 'create'[\s\S]*'\{\}'::jsonb/s);
  assert.match(sql, /target_trip_id is null/);
});
test("22 WhatsApp sharing includes setup URL and no PIN", () => {
  const message = sharing.companionInvitationMessage("Organizador", "Viaje", "https://nioli.test/setup#token=abc");
  const url = decodeURIComponent(sharing.whatsappShareUrl({ setupUrl: "https://nioli.test/setup#token=abc", message, subject: "Invitación" }));
  assert.match(url, /setup#token=abc/);
  assert.doesNotMatch(url, /\bPIN\s*[:=]\s*\d{6}\b/i);
});
test("23 email sharing includes setup URL and no PIN", () => {
  const message = sharing.travelerInvitationMessage("Organizador", "https://nioli.test/setup#token=abc");
  const url = decodeURIComponent(sharing.emailShareUrl({ setupUrl: "https://nioli.test/setup#token=abc", message, subject: "Invitación" }));
  assert.match(url, /setup#token=abc/);
  assert.doesNotMatch(url, /\bPIN\s*[:=]\s*\d{6}\b/i);
});
test("24 native share falls back safely to copying", async () => {
  let copied = "";
  const invitation = { setupUrl: "https://nioli.test/setup#token=abc", message: "Invitación", subject: "NIOLI" };
  const result = await sharing.shareInvitation(invitation, undefined, async (value) => { copied = value; });
  assert.equal(result, "copied");
  assert.equal(copied, invitation.setupUrl);
});
test("25 Privacy Part 1 stayed byte-for-byte unchanged", () => {
  assert.equal(createHash("sha256").update(part1).digest("hex"), "918064455f88889d555ca3d9a0ffb774283f69eb04b196844fc73be7d1e98470");
});
test("26 setup tokens use at least 32 random bytes", () => assert.match(sql, /gen_random_bytes\(32\)/));
test("27 PIN hashes use bcrypt cost 12", () => assert.match(sql, /gen_salt\('bf', 12\)/));
test("28 setup URL uses the request origin dynamically", () => {
  assert.match(api, /new URL\("\/setup", new URL\(request\.url\)\.origin\)/);
  assert.doesNotMatch(api, /localhost|vercel\.app/);
});
test("29 setup URL carries the token only in a fragment", () => {
  const helper = api.slice(api.indexOf("function setupUrl"), api.indexOf("function firstRow"));
  assert.match(helper, /url\.hash = `token=\$\{token\}`/);
  assert.doesNotMatch(helper, /searchParams|\?token=/);
  assert.doesNotMatch(helper, /participant|workspace|permission|pin/i);
});
test("30 setup UI has explicit expired, used and revoked states", () => {
  assert.match(setupUi, /Esta invitación venció/);
  assert.match(setupUi, /Esta invitación ya fue utilizada/);
  assert.match(setupUi, /Esta invitación ya no es válida/);
});
test("31 known plaintext PIN RPCs are execute-revoked", () => {
  assert.match(sql, /revoke execute on function app\.generate_participant_pin/);
  assert.match(sql, /revoke execute on function app\.generate_guest_workspace_pin/);
  assert.match(sql, /revoke execute on function app\.regenerate_guest_workspace_pin/);
});
test("32 generated invitation URLs never use a token query", () => {
  assert.doesNotMatch(api, /\?token=|searchParams\.set\(["']token/);
  assert.doesNotMatch(sharingSource, /setup\?token=/);
});
test("33 inspection never sends a setup token via GET", () => {
  assert.doesNotMatch(setupApi, /export async function GET/);
  assert.match(setupUi, /method: "POST"/);
  assert.match(setupUi, /action: "inspect", token/);
  assert.doesNotMatch(setupUi, /travel-setup\?token/);
});
test("34 setup token is never persisted in browser storage or cookies", () => {
  assert.doesNotMatch(setupUi, /localStorage|sessionStorage|document\.cookie|cookieStore/i);
  assert.match(setupUi, /useRef<string \| undefined>/);
});
test("35 fragment token is removed from the visible URL after capture", () => {
  assert.match(setupUi, /window\.location\.hash\.slice\(1\)/);
  assert.match(setupUi, /window\.history\.replaceState/);
  assert.match(setupUi, /window\.location\.pathname/);
  assert.doesNotMatch(setupUi, /window\.location\.search/);
});
test("36 all sharing paths expose no plaintext PIN", async () => {
  const setupUrl = "https://nioli.test/setup#token=abc";
  const message = sharing.companionInvitationMessage("Organizador", "Viaje", setupUrl);
  const invitation = { setupUrl, message, subject: "Invitación" };
  let nativePayload;
  await sharing.shareInvitation(invitation, async (payload) => { nativePayload = payload; }, async () => {});
  const surfaces = [message, sharing.whatsappShareUrl(invitation), sharing.emailShareUrl(invitation), JSON.stringify(nativePayload)];
  for (const surface of surfaces) assert.doesNotMatch(surface, /\bPIN\s*[:=]\s*\d{6}\b/i);
});
test("37 obsolete 202608270002 migration is absent", () => {
  assert.ok(!migrationFiles.includes("202608270002_privacy_by_default_part2.sql"));
});
test("38 invitation flow contains no mojibake", () => {
  const flow = [sql, api, setupApi, setupUi, setupPage, sharingSource, accessView].join("\n");
  assert.doesNotMatch(flow, /Â|â|Ã/);
  assert.match(sql, /' · NIOLI'/);
});
test("39 setup responses and document are non-cacheable and non-indexable", () => {
  assert.match(setupApi, /private, no-store, max-age=0/);
  assert.match(api, /privateInvitationJson[\s\S]*private, no-store, max-age=0/);
  assert.match(nextConfig, /source: "\/setup"[\s\S]*Referrer-Policy[\s\S]*no-referrer/);
  assert.match(nextConfig, /X-Robots-Tag[\s\S]*noindex, nofollow/);
  assert.match(setupPage, /robots: \{ index: false, follow: false, nocache: true \}/);
});
