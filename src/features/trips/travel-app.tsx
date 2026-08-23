"use client";

import { type CSSProperties, useCallback, useState } from "react";

import { CountrySelector } from "@/components/country-selector";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { SideNavigation } from "@/components/navigation/side-navigation";
import { TopBar } from "@/components/navigation/top-bar";
import { countryThemeById } from "@/data/countries";
import { AdventureView } from "@/features/achievements/adventure-view";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { ExpensesView } from "@/features/expenses/expenses-view";
import { ItineraryView } from "@/features/itinerary/itinerary-view";
import { MapView } from "@/features/maps/map-view";
import { useGeolocation } from "@/features/maps/use-geolocation";
import { ReservationsView } from "@/features/reservations/reservations-view";
import type {
  Activity,
  Achievement,
  Budget,
  CountryId,
  Expense,
  FeatureId,
  GeoPosition,
  Reservation,
  TravelPhoto,
  Trip,
} from "@/types/travel";

const isInJapan = ({ latitude, longitude }: GeoPosition) =>
  latitude >= 24 && latitude <= 46 && longitude >= 122 && longitude <= 146;

const distanceInMeters = (position: GeoPosition, target: { latitude: number; longitude: number }) => {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(target.latitude - position.latitude);
  const longitudeDelta = toRadians(target.longitude - position.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(position.latitude)) * Math.cos(toRadians(target.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function TravelApp({ initialTrip }: { initialTrip: Trip }) {
  const [activeFeature, setActiveFeature] = useState<FeatureId>("dashboard");
  const [selectedCountry, setSelectedCountry] = useState<CountryId>(initialTrip.countryId);
  const [countrySelectorOpen, setCountrySelectorOpen] = useState(false);
  const [companionEnabled, setCompanionEnabled] = useState(true);
  const [activeParticipantId, setActiveParticipantId] = useState(initialTrip.participants[0].id);
  const [budget, setBudget] = useState<Budget>(initialTrip.budget);
  const [expenses, setExpenses] = useState<Expense[]>(initialTrip.expenses);
  const [itinerary, setItinerary] = useState(initialTrip.itinerary);
  const [reservations, setReservations] = useState(initialTrip.reservations);
  const [achievements, setAchievements] = useState<Achievement[]>(initialTrip.achievements);
  const [photos, setPhotos] = useState<TravelPhoto[]>(initialTrip.photos);
  const { position, status: locationStatus, error: locationError, requestLocation } = useGeolocation();
  const theme = countryThemeById[selectedCountry];
  const activeParticipant = initialTrip.participants.find((participant) => participant.id === activeParticipantId)
    ?? initialTrip.participants[0];
  const spentInBudgetCurrency = expenses
    .filter((expense) => expense.currency === budget.currency)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const trip: Trip = { ...initialTrip, budget, expenses, itinerary, reservations, achievements, photos };

  const themeStyle = {
    "--accent": theme.colors.accent,
    "--accent-dark": theme.colors.accentDark,
    "--accent-soft": theme.colors.soft,
    "--highlight": theme.colors.highlight,
  } as CSSProperties;

  const navigate = (feature: FeatureId) => {
    setActiveFeature(feature);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCountry = (country: CountryId) => {
    setSelectedCountry(country);
    setCountrySelectorOpen(false);
  };

  const addActivity = (dayId: string, activity: Activity) => {
    setItinerary((currentItinerary) => currentItinerary.map((day) =>
      day.id === dayId ? { ...day, activities: [...day.activities, activity] } : day,
    ));
  };

  const updateAchievementForParticipant = useCallback((id: string, participantId: string, unlocked: boolean) => {
    setAchievements((currentAchievements) => currentAchievements.map((achievement) => {
      if (achievement.id !== id) return achievement;
      const unlockedBy = unlocked
        ? Array.from(new Set([...achievement.unlockedBy, participantId]))
        : achievement.unlockedBy.filter((currentId) => currentId !== participantId);
      return { ...achievement, unlockedBy };
    }));
  }, []);

  const toggleAchievement = (id: string) => {
    const achievement = achievements.find((item) => item.id === id);
    if (!achievement) return;
    updateAchievementForParticipant(id, activeParticipant.id, !achievement.unlockedBy.includes(activeParticipant.id));
  };

  const requestCurrentLocation = useCallback(async () => {
    const nextPosition = await requestLocation();
    if (!nextPosition) return undefined;

    setAchievements((currentAchievements) => currentAchievements.map((achievement) => {
      const reachedJapan = achievement.id === "reach-japan" && isInJapan(nextPosition);
      const reachedTrigger = achievement.geoTriggers?.some((trigger) => distanceInMeters(nextPosition, trigger) <= trigger.radiusMeters);
      if (!reachedJapan && !reachedTrigger) return achievement;
      return { ...achievement, unlockedBy: Array.from(new Set([...achievement.unlockedBy, activeParticipant.id])) };
    }));
    return nextPosition;
  }, [activeParticipant.id, requestLocation]);

  const addPhoto = (photo: TravelPhoto) => {
    setPhotos((currentPhotos) => [photo, ...currentPhotos]);
    if (photo.achievementId) {
      updateAchievementForParticipant(photo.achievementId, photo.participantId, true);
    }
  };

  return (
    <div className="travel-shell" style={themeStyle}>
      <SideNavigation
        trip={trip}
        active={activeFeature}
        companionEnabled={companionEnabled}
        onNavigate={navigate}
        onToggleCompanion={() => setCompanionEnabled((enabled) => !enabled)}
      />

      <div className="app-stage">
        <TopBar
          trip={trip}
          theme={theme}
          activeParticipantId={activeParticipant.id}
          onSelectParticipant={setActiveParticipantId}
          onOpenCountries={() => setCountrySelectorOpen(true)}
        />
        <main className="app-main">
          {activeFeature === "dashboard" ? (
            <DashboardView
              trip={trip}
              theme={theme}
              participant={activeParticipant}
              spent={spentInBudgetCurrency}
              onNavigate={navigate}
            />
          ) : null}
          {activeFeature === "itinerary" ? <ItineraryView itinerary={itinerary} onAddActivity={addActivity} /> : null}
          {activeFeature === "expenses" ? (
            <ExpensesView
              trip={trip}
              expenses={expenses}
              activeParticipant={activeParticipant}
              onAddExpense={(expense) => setExpenses((current) => [expense, ...current])}
              onUpdateBudget={setBudget}
            />
          ) : null}
          {activeFeature === "reservations" ? (
            <ReservationsView
              reservations={reservations}
              onAddReservation={(reservation: Reservation) => setReservations((current) => [reservation, ...current])}
            />
          ) : null}
          {activeFeature === "map" ? (
            <MapView
              trip={trip}
              position={position}
              locationStatus={locationStatus}
              locationError={locationError}
              onRequestLocation={requestCurrentLocation}
            />
          ) : null}
          {activeFeature === "adventure" ? (
            <AdventureView
              achievements={achievements}
              participant={activeParticipant}
              photos={photos.filter((photo) => photo.participantId === activeParticipant.id)}
              position={position}
              locationStatus={locationStatus}
              locationError={locationError}
              companionEnabled={companionEnabled}
              onRequestLocation={requestCurrentLocation}
              onSavePhoto={addPhoto}
              onToggleAchievement={toggleAchievement}
              onToggleCompanion={() => setCompanionEnabled((enabled) => !enabled)}
            />
          ) : null}
        </main>
      </div>

      {companionEnabled && activeFeature !== "adventure" ? (
        <button type="button" className="floating-companion" onClick={() => navigate("adventure")} aria-label="Abrir compañero de viaje">
          <span aria-hidden="true">⚡</span>
          <small>¡Ikō!</small>
        </button>
      ) : null}

      <BottomNavigation active={activeFeature} onNavigate={navigate} />
      <CountrySelector activeCountry={selectedCountry} open={countrySelectorOpen} onClose={() => setCountrySelectorOpen(false)} onSelect={selectCountry} />
    </div>
  );
}
