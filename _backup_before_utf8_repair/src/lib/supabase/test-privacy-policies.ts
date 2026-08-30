import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createTripSessionTestClient,
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

function isVisible(data: unknown, error: unknown): boolean {
  return !error && Array.isArray(data) && data.length === 1;
}

function isDeniedMutation(data: unknown, error: unknown): boolean {
  return isInvisible(data, error);
}

export interface PrivacyPolicyTestContext extends PrivacyClientConfig {
  andySessionToken: string;
  joseSessionToken: string;
  andyParticipantId: string;
  joseParticipantId: string;
  andyPhotoId: string;
  josePhotoId: string;
  joseStampUnlockId: string;
  joseCompanionProgressId: string;
  andyPrivateExpenseId: string;
  sharedExpenseId: string;
  /** Disposable José-owned records used only by the update/delete denial probe. */
  mutationProbe: {
    photoId: string;
    stampUnlockId: string;
    companionProgressId: string;
    expenseId: string;
  };
}

export class PrivacyPolicyTest {
  private readonly andyClient: SupabaseClient;
  private readonly joseClient: SupabaseClient;

  constructor(private readonly context: PrivacyPolicyTestContext) {
    this.andyClient = createTripSessionTestClient(context, context.andySessionToken);
    this.joseClient = createTripSessionTestClient(context, context.joseSessionToken);
  }

  // Scenario 1: owner Andy cannot read José's private photo.
  async andyCannotReadJosePhoto(): Promise<PrivacyScenarioResult> {
    const result = await this.andyClient
      .from("photos")
      .select("id")
      .eq("id", this.context.josePhotoId);
    const passed = isInvisible(result.data, result.error);
    return {
      scenario: 1,
      name: "Andy cannot read José private photos",
      passed,
      details: passed ? undefined : "José's photo was visible to Andy.",
    };
  }

  // Scenario 2: José cannot read Andy's private photo.
  async joseCannotReadAndyPhoto(): Promise<PrivacyScenarioResult> {
    const result = await this.joseClient
      .from("photos")
      .select("id")
      .eq("id", this.context.andyPhotoId);
    const passed = isInvisible(result.data, result.error);
    return {
      scenario: 2,
      name: "José cannot read Andy private photos",
      passed,
      details: passed ? undefined : "Andy's photo was visible to José.",
    };
  }

  // Scenario 3: the owner has no bypass for another participant's stamp unlock.
  async ownerCannotReadOtherStampUnlock(): Promise<PrivacyScenarioResult> {
    const result = await this.andyClient
      .from("stamp_unlocks")
      .select("id")
      .eq("id", this.context.joseStampUnlockId);
    const passed = isInvisible(result.data, result.error);
    return {
      scenario: 3,
      name: "Owner cannot read another participant stamp unlocks",
      passed,
      details: passed ? undefined : "José's stamp unlock was visible to the owner.",
    };
  }

  // Scenario 4: the owner has no bypass for companion progress.
  async ownerCannotReadOtherCompanionProgress(): Promise<PrivacyScenarioResult> {
    const result = await this.andyClient
      .from("companion_progress")
      .select("id")
      .eq("id", this.context.joseCompanionProgressId);
    const passed = isInvisible(result.data, result.error);
    return {
      scenario: 4,
      name: "Owner cannot read another participant companion progress",
      passed,
      details: passed ? undefined : "José's companion progress was visible to the owner.",
    };
  }

  // Scenario 5: a private expense is visible to its owner and hidden from peers.
  async privateExpensesRemainPrivate(): Promise<PrivacyScenarioResult> {
    const [ownerResult, peerResult] = await Promise.all([
      this.andyClient
        .from("expenses")
        .select("id")
        .eq("id", this.context.andyPrivateExpenseId),
      this.joseClient
        .from("expenses")
        .select("id")
        .eq("id", this.context.andyPrivateExpenseId),
    ]);
    const passed = isVisible(ownerResult.data, ownerResult.error)
      && isInvisible(peerResult.data, peerResult.error);
    return {
      scenario: 5,
      name: "Private expenses remain private",
      passed,
      details: passed ? undefined : "The private expense was hidden from its owner or visible to a peer.",
    };
  }

  // Scenario 6: an explicitly shared expense is visible to both trip participants.
  async sharedExpensesAreTripReadable(): Promise<PrivacyScenarioResult> {
    const [andyResult, joseResult] = await Promise.all([
      this.andyClient
        .from("expenses")
        .select("id")
        .eq("id", this.context.sharedExpenseId),
      this.joseClient
        .from("expenses")
        .select("id")
        .eq("id", this.context.sharedExpenseId),
    ]);
    const passed = isVisible(andyResult.data, andyResult.error)
      && isVisible(joseResult.data, joseResult.error);
    return {
      scenario: 6,
      name: "Shared expenses are readable to trip participants",
      passed,
      details: passed ? undefined : "The shared expense was not visible to both participants.",
    };
  }

  // Scenario 7: owner writes/deletes against José-owned QA records must affect
  // zero rows. The supplied records must be disposable in case a broken policy
  // is discovered; never point this probe at canonical production content.
  async ownerCannotMutateOtherPrivateRecords(): Promise<PrivacyScenarioResult> {
    const probe = this.context.mutationProbe;
    const updateResults = await Promise.all([
      this.andyClient.from("photos").update({ participant_id: this.context.joseParticipantId }).eq("id", probe.photoId).select("id"),
      this.andyClient.from("stamp_unlocks").update({ participant_id: this.context.joseParticipantId }).eq("id", probe.stampUnlockId).select("id"),
      this.andyClient.from("companion_progress").update({ participant_id: this.context.joseParticipantId }).eq("id", probe.companionProgressId).select("id"),
      this.andyClient.from("expenses").update({ participant_id: this.context.joseParticipantId }).eq("id", probe.expenseId).select("id"),
    ]);
    const deleteResults = await Promise.all([
      this.andyClient.from("photos").delete().eq("id", probe.photoId).select("id"),
      this.andyClient.from("stamp_unlocks").delete().eq("id", probe.stampUnlockId).select("id"),
      this.andyClient.from("companion_progress").delete().eq("id", probe.companionProgressId).select("id"),
      this.andyClient.from("expenses").delete().eq("id", probe.expenseId).select("id"),
    ]);
    const passed = [...updateResults, ...deleteResults]
      .every((result) => isDeniedMutation(result.data, result.error));
    return {
      scenario: 7,
      name: "Owner cannot update or delete another participant private records",
      passed,
      details: passed ? undefined : "At least one owner mutation affected another participant's row.",
    };
  }

  async run(): Promise<PrivacyScenarioResult[]> {
    return Promise.all([
      this.andyCannotReadJosePhoto(),
      this.joseCannotReadAndyPhoto(),
      this.ownerCannotReadOtherStampUnlock(),
      this.ownerCannotReadOtherCompanionProgress(),
      this.privateExpensesRemainPrivate(),
      this.sharedExpensesAreTripReadable(),
      this.ownerCannotMutateOtherPrivateRecords(),
    ]);
  }
}

export async function runPrivacyTests(
  context: PrivacyPolicyTestContext,
): Promise<PrivacyScenarioResult[]> {
  return new PrivacyPolicyTest(context).run();
}
