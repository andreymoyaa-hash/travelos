import type { Trip } from "@/types/travel";

export type CloudRole = "owner" | "editor" | "participant" | "viewer";

export interface CloudParticipant {
  id: string;
  name: string;
  role: CloudRole;
}

export interface TravelSession {
  accessKind?: "trip";
  trip: { id: string; name: string; slug?: string; mapProvider?: "google" | "open" };
  participant: CloudParticipant;
  permissions: Record<string, boolean>;
  expiresAt: string;
  workspace?: { id: string; name: string };
}

export interface TravelWorkspaceSession {
  accessKind: "workspace";
  workspace: { id: string; name: string; mapProvider: "google" | "open" };
  profile: { name: string; role: "guest" };
  expiresAt: string;
}

export type TravelAccessSession = TravelSession | TravelWorkspaceSession;

export interface WorkspaceTripSummary {
  id: string;
  name: string;
  countryCode: string;
  startDate?: string;
  endDate?: string;
  mapProvider: "google" | "open";
}

export interface CloudTripPayload {
  trip: Trip;
  session: TravelSession;
}

export interface AccessParticipant extends CloudParticipant {
  avatarUrl?: string;
  permissions?: Record<string, boolean>;
  accessActive?: boolean;
}

export interface AccessGuestWorkspace {
  id: string;
  displayName: string;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
  tripCount?: number;
}
