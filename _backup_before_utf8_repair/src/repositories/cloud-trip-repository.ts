import type { CloudTripPayload, TravelSession } from "@/types/cloud";
import type { TravelPhoto, Trip } from "@/types/travel";

const BACKUP_PREFIX = "travel-os:cloud-backup:v1:";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

class CloudTripRepository {
  private timer?: ReturnType<typeof setTimeout>;
  private pending?: Trip;
  private saving = false;

  private backupKey(tripId: string) { return `${BACKUP_PREFIX}${tripId}`; }

  private writeBackup(trip: Trip) {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(this.backupKey(trip.id), JSON.stringify(trip)); } catch { /* Cloud remains primary when browser storage is unavailable. */ }
  }

  private readBackup(tripId: string) {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(this.backupKey(tripId));
      return raw ? JSON.parse(raw) as Trip : null;
    } catch { return null; }
  }

  async prepare(session: TravelSession) {
    if (session.participant.role !== "owner" || session.trip.slug !== "japan-2026") return;
    const response = await fetch("/api/travel-cloud/migrate", { method: "POST" });
    if (!response.ok) throw new Error((await response.json().catch(() => ({})) as { error?: string }).error ?? "No se pudo preparar el viaje remoto.");
  }

  async load(session: TravelSession): Promise<CloudTripPayload> {
    try {
      const response = await fetch("/api/travel-cloud", { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})) as { error?: string }).error ?? "Cloud Mode no disponible.");
      const payload = await response.json() as CloudTripPayload;
      this.writeBackup(payload.trip);
      return payload;
    } catch (error) {
      const backup = this.readBackup(session.trip.id);
      if (backup) return { trip: backup, session };
      throw error;
    }
  }

  saveTripData(trip: Trip) {
    this.writeBackup(trip);
    this.pending = clone(trip);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 650);
  }

  private async flush() {
    if (this.saving || !this.pending) return;
    this.saving = true;
    const trip = this.pending;
    this.pending = undefined;
    try {
      const response = await fetch("/api/travel-cloud", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trip }) });
      if (!response.ok) throw new Error("Cloud save failed");
    } catch {
      this.pending = this.pending ?? trip;
    } finally {
      this.saving = false;
      if (this.pending) this.timer = setTimeout(() => void this.flush(), 1600);
    }
  }

  async uploadPhoto(photo: TravelPhoto) {
    const response = await fetch("/api/travel-cloud/photos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo }) });
    const payload = await response.json().catch(() => ({})) as { photo?: TravelPhoto; error?: string };
    if (!response.ok || !payload.photo) throw new Error(payload.error ?? "No se pudo subir la foto.");
    return payload.photo;
  }

  clearTripState(tripId: string) {
    this.pending = undefined;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("travel-os:active-trip:v2");
      // The scoped backup is retained intentionally so an outage never destroys the traveler's data.
      void tripId;
    }
  }
}

export const cloudTripRepository = new CloudTripRepository();
