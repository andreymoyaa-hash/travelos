import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createPublicTestClient,
  createTripSessionTestClient,
  createWorkspaceSessionTestClient,
  type PrivacyClientConfig,
  type PrivacyScenarioResult,
} from "./test-authorization";

interface DatabaseErrorLike {
  code?: string;
}

function isInvisible(data: unknown, error: unknown): boolean {
  if ((error as DatabaseErrorLike | null)?.code === "42501") return true;
  return !error && Array.isArray(data) && data.length === 0;
}

export interface PinSetupTestContext extends PrivacyClientConfig {
  platformAdminTripSessionToken: string;
  otherParticipantId: string;
  workspaceId: string;
  oneTimeSetupWorkspaceId: string;
  /** Fresh token for a disposable workspace; scenario 12 consumes it. */
  oneTimeSetupToken: string;
  /** Pre-seeded token whose expires_at is already in the past. */
  expiredSetupToken: string;
  /** Session created before scenario 14 issues a reset. */
  oldWorkspaceSessionToken: string;
  /** Non-trivial, disposable six-digit PINs used only in the QA database. */
  firstSetupPin: string;
  secondSetupPin: string;
  resetPin: string;
}

export class PinSetupPrivacyTest {
  private readonly ownerClient: SupabaseClient;
  private readonly publicClient: SupabaseClient;

  constructor(private readonly context: PinSetupTestContext) {
    this.ownerClient = createTripSessionTestClient(
      context,
      context.platformAdminTripSessionToken,
    );
    this.publicClient = createPublicTestClient(context);
  }

  // Scenario 11: hashes are not selectable and legacy plaintext-PIN RPCs are
  // not executable by an owner session.
  async ownerCannotRetrieveAnotherPin(): Promise<PrivacyScenarioResult> {
    const [participantAccess, workspaceAccess, legacyReset] = await Promise.all([
      this.ownerClient
        .from("trip_access")
        .select("pin_hash")
        .eq("participant_id", this.context.otherParticipantId),
      this.ownerClient
        .from("guest_workspace_access")
        .select("pin_hash")
        .eq("workspace_id", this.context.workspaceId),
      this.ownerClient
        .schema("app")
        .rpc("regenerate_guest_workspace_pin", {
          p_workspace_id: this.context.workspaceId,
        }),
    ]);
    const passed = isInvisible(participantAccess.data, participantAccess.error)
      && isInvisible(workspaceAccess.data, workspaceAccess.error)
      && Boolean(legacyReset.error);
    return {
      scenario: 11,
      name: "Owner cannot retrieve another participant PIN",
      passed,
      details: passed ? undefined : "A PIN hash was visible or the legacy plaintext reset RPC remained executable.",
    };
  }

  // Scenario 12: the first completion succeeds and the same token then fails.
  async setupTokenWorksOnlyOnce(): Promise<PrivacyScenarioResult> {
    const first = await this.publicClient
      .schema("app")
      .rpc("complete_access_setup_invitation", {
        p_setup_token: this.context.oneTimeSetupToken,
        p_pin: this.context.firstSetupPin,
      });
    const second = await this.publicClient
      .schema("app")
      .rpc("complete_access_setup_invitation", {
        p_setup_token: this.context.oneTimeSetupToken,
        p_pin: this.context.secondSetupPin,
      });
    const firstRows = (first.data ?? []) as Array<{ workspace_id?: string }>;
    const passed = !first.error
      && firstRows[0]?.workspace_id === this.context.oneTimeSetupWorkspaceId
      && Boolean(second.error);
    return {
      scenario: 12,
      name: "Setup token works only once",
      passed,
      details: passed ? undefined : "The first redemption failed or the token was accepted twice.",
    };
  }

  // Scenario 13: a pre-seeded expired setup token cannot choose a PIN.
  async expiredSetupTokenFails(): Promise<PrivacyScenarioResult> {
    const result = await this.publicClient
      .schema("app")
      .rpc("complete_access_setup_invitation", {
        p_setup_token: this.context.expiredSetupToken,
        p_pin: this.context.secondSetupPin,
      });
    const passed = Boolean(result.error);
    return {
      scenario: 13,
      name: "Expired setup token fails",
      passed,
      details: passed ? undefined : "An expired setup token was accepted.",
    };
  }

  // Scenario 14: issuing a reset deactivates the old PIN and revokes every
  // existing workspace session before the replacement PIN is selected.
  async pinResetRevokesPreviousSessions(): Promise<PrivacyScenarioResult> {
    const reset = await this.ownerClient
      .schema("app")
      .rpc("issue_independent_traveler_pin_reset", {
        p_workspace_id: this.context.workspaceId,
      });
    const resetRows = (reset.data ?? []) as Array<{
      setup_token?: string;
      setup_expires_at?: string;
      pin?: unknown;
      guest_pin?: unknown;
    }>;
    const resetRow = resetRows[0];
    if (
      reset.error
      || typeof resetRow.setup_token !== "string"
      || "pin" in resetRow
      || "guest_pin" in resetRow
    ) {
      return {
        scenario: 14,
        name: "PIN reset revokes previous sessions",
        passed: false,
        details: "The reset failed or returned plaintext PIN material.",
      };
    }

    const oldWorkspaceClient = createWorkspaceSessionTestClient(
      this.context,
      this.context.oldWorkspaceSessionToken,
    );
    const beforeReplacement = await oldWorkspaceClient
      .schema("app")
      .rpc("current_guest_workspace_id");
    const completion = await this.publicClient
      .schema("app")
      .rpc("complete_access_setup_invitation", {
        p_setup_token: resetRow.setup_token,
        p_pin: this.context.resetPin,
      });
    const afterReplacement = await oldWorkspaceClient
      .schema("app")
      .rpc("current_guest_workspace_id");
    const oldSessionInvalidBefore = beforeReplacement.data !== this.context.workspaceId;
    const oldSessionStillInvalid = afterReplacement.data !== this.context.workspaceId;
    const passed = oldSessionInvalidBefore
      && !completion.error
      && oldSessionStillInvalid;

    return {
      scenario: 14,
      name: "PIN reset revokes previous sessions",
      passed,
      details: passed ? undefined : "An old workspace session survived reset or replacement setup failed.",
    };
  }

  async run(): Promise<PrivacyScenarioResult[]> {
    // These scenarios intentionally mutate disposable QA fixtures and therefore
    // run sequentially. Scenarios 12 and 14 use separate disposable workspaces.
    return [
      await this.ownerCannotRetrieveAnotherPin(),
      await this.setupTokenWorksOnlyOnce(),
      await this.expiredSetupTokenFails(),
      await this.pinResetRevokesPreviousSessions(),
    ];
  }
}

export async function runPinSetupTests(
  context: PinSetupTestContext,
): Promise<PrivacyScenarioResult[]> {
  return new PinSetupPrivacyTest(context).run();
}
