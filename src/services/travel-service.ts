import type { Budget, Expense, Reservation, TravelPhoto, Trip } from "@/types/travel";

/**
 * Contract for the persistence layer planned for phase 2.
 * The UI currently receives serializable seed data and can later swap in an
 * implementation backed by a database without changing feature components.
 */
export interface TravelService {
  getTrip(id: string): Promise<Trip | null>;
  listTrips(): Promise<Trip[]>;
  createExpense(tripId: string, expense: Expense): Promise<Expense>;
  updateBudget(tripId: string, budget: Budget): Promise<Budget>;
  createReservation(tripId: string, reservation: Reservation): Promise<Reservation>;
  createPhoto(tripId: string, photo: TravelPhoto): Promise<TravelPhoto>;
}
