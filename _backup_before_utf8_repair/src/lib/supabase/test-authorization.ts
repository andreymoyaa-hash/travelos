import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface PrivacyClientConfig {
  supabaseUrl: string;
  publishableKey: string;
}

export interface PrivacyScenarioResult {
  scenario: number;
  name: string;
  passed: boolean;
  details?: string;
}

export function createTripSessionTestClient(
  config: PrivacyClientConfig,
  sessionToken: string,
): SupabaseClient {
  return createClient(config.supabaseUrl, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { "x-travel-session": sessionToken } },
  });
}

export function createWorkspaceSessionTestClient(
  config: PrivacyClientConfig,
  sessionToken: string,
): SupabaseClient {
  return createClient(config.supabaseUrl, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { "x-workspace-session": sessionToken } },
  });
}

export function createPublicTestClient(config: PrivacyClientConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function hasNoRows(data: unknown, error: unknown): boolean {
  return !error && Array.isArray(data) && data.length === 0;
}

function deniedRpc(data: unknown, error: unknown): boolean {
  if (error) return true;
  return !Array.isArray(data) || data.length === 0;
}

export interface AuthorizationTestContext extends PrivacyClientConfig {
  ownerTripSessionToken: string;
  guestAWorkspaceSessionToken: string;
  guestATripId: string;
  guestBTripId: string;
  japan2026TripId: string;
}

export class AuthorizationPrivacyTest {
  private readonly ownerClient: SupabaseClient;
  private readonly guestAClient: SupabaseClient;

  constructor(private readonly context: AuthorizationTestContext) {
    this.ownerClient = createTripSessionTestClient(
      context,
      context.ownerTripSessionToken,
    );
    this.guestAClient = createWorkspaceSessionTestClient(
      context,
      context.guestAWorkspaceSessionToken,
    );
  }

  // Scenario 8: Guest A cannot list or open Guest B's workspace trip.
  async guestACannotAccessGuestB(): Promise<PrivacyScenarioResult> {
    const [listResult, openResult] = await Promise.all([
      this.guestAClient.schema("app").rpc("list_guest_workspace_trips"),
      this.guestAClient.schema("app").rpc("open_guest_workspace_trip", {
        p_trip_id: this.context.guestBTripId,
      }),
    ]);
    const listedIds = new Set(
      ((listResult.data ?? []) as Array<{ trip_id?: string }>)
        .map((row) => row.trip_id)
        .filter((id): id is string => Boolean(id)),
    );
    const passed = !listResult.error
      && listedIds.has(this.context.guestATripId)
      && !listedIds.has(this.context.guestBTripId)
      && deniedRpc(openResult.data, openResult.error);

    return {
      scenario: 8,
      name: "Guest A cannot access Guest B workspace",
      passed,
      details: passed ? undefined : "Guest B appeared in the list or could be opened.",
    };
  }

  // Scenario 9: a guest workspace cannot open the canonical Japan 2026 trip.
  async guestACannotAccessJapan2026(): Promise<PrivacyScenarioResult> {
    const [listResult, openResult] = await Promise.all([
      this.guestAClient.schema("app").rpc("list_guest_workspace_trips"),
      this.guestAClient.schema("app").rpc("open_guest_workspace_trip", {
        p_trip_id: this.context.japan2026TripId,
      }),
    ]);
    const listedIds = new Set(
      ((listResult.data ?? []) as Array<{ trip_id?: string }>)
        .map((row) => row.trip_id)
        .filter((id): id is string => Boolean(id)),
    );
    const passed = !listResult.error
      && !listedIds.has(this.context.japan2026TripId)
      && deniedRpc(openResult.data, openResult.error);

    return {
      scenario: 9,
      name: "Guest A cannot access Japan 2026",
      passed,
      details: passed ? undefined : "Japan 2026 was listed or could be opened.",
    };
  }

  // Scenario 10: the inviter receives minimal metadata, never guest trip content.
  async inviterCannotInspectGuestContent(): Promise<PrivacyScenarioResult> {
    const contentQueries = await Promise.all([
      this.ownerClient.from("trips").select("id").eq("id", this.context.guestATripId),
      this.ownerClient.from("trip_days").select("id").eq("trip_id", this.context.guestATripId).limit(1),
      this.ownerClient.from("activities").select("id").eq("trip_id", this.context.guestATripId).limit(1),
      this.ownerClient.from("locations").select("id").eq("trip_id", this.context.guestATripId).limit(1),
      this.ownerClient.from("reservations").select("id").eq("trip_id", this.context.guestATripId).limit(1),
      this.ownerClient.from("expenses").select("id").eq("trip_id", this.context.guestATripId).limit(1),
      this.ownerClient.from("photos").select("id").eq("trip_id", this.context.guestATripId).limit(1),
      this.ownerClient.from("passport_stamps").select("id").eq("trip_id", this.context.guestATripId).limit(1),
      this.ownerClient.from("stamp_unlocks").select("id").eq("trip_id", this.context.guestATripId).limit(1),
    ]);
    const metadataResult = await this.ownerClient
      .schema("app")
      .rpc("list_guest_workspace_accesses");
    const allowedKeys = new Set([
      "workspace_id",
      "display_name",
      "is_active",
      "expires_at",
      "created_at",
    ]);
    const metadataRows = (metadataResult.data ?? []) as Array<Record<string, unknown>>;
    const onlyMinimalMetadata = !metadataResult.error
      && metadataRows.every((row) => Object.keys(row).every((key) => allowedKeys.has(key)))
      && metadataRows.every((row) => !("trip_count" in row));
    const noContent = contentQueries.every((result) => hasNoRows(result.data, result.error));
    const passed = noContent && onlyMinimalMetadata;

    return {
      scenario: 10,
      name: "Inviter cannot inspect guest trip content",
      passed,
      details: passed ? undefined : "Guest content or non-minimal metadata was visible.",
    };
  }

  async run(): Promise<PrivacyScenarioResult[]> {
    return Promise.all([
      this.guestACannotAccessGuestB(),
      this.guestACannotAccessJapan2026(),
      this.inviterCannotInspectGuestContent(),
    ]);
  }
}

export async function runAuthorizationTests(
  context: AuthorizationTestContext,
): Promise<PrivacyScenarioResult[]> {
  return new AuthorizationPrivacyTest(context).run();
}
