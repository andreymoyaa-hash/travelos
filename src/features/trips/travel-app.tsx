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
  TripBase,
  TripDay,
  TripLocation,
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

const shortWeekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const shortMonths = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const getDateLabels = (date: string) => {
  const parsed = new Date(`${date}T12:00:00Z`);
  return {
    weekday: shortWeekdays[parsed.getUTCDay()],
    dayNumber: date.slice(-2),
    month: shortMonths[parsed.getUTCMonth()],
  };
};

const formatReservationDate = (date: string) => {
  const labels = getDateLabels(date);
  return `${labels.dayNumber} ${labels.month}`;
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
  const [bases, setBases] = useState(initialTrip.bases);
  const [savedPlaces, setSavedPlaces] = useState(initialTrip.savedPlaces);
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
  const trip: Trip = { ...initialTrip, budget, expenses, itinerary, bases, savedPlaces, reservations, achievements, photos };

  const themeStyle = {
    "--accent": theme.colors.accent,
    "--accent-dark": theme.colors.accentDark,
    "--accent-soft": theme.colors.soft,
    "--highlight": theme.colors.highlight,
    "--ink": theme.colors.ink,
    "--paper": theme.colors.paper,
    "--surface": theme.colors.surface,
    "--secondary": theme.colors.secondary,
    "--nature": theme.colors.nature,
    "--cultural": theme.colors.cultural,
    "--premium": theme.colors.premium,
    "--route-travel": theme.routeColors.travel,
    "--route-transition": theme.routeColors.transition,
    "--route-base-1": theme.routeColors.bases[0],
    "--route-base-2": theme.routeColors.bases[1],
    "--route-base-3": theme.routeColors.bases[2],
    "--route-base-4": theme.colors.cultural,
  } as CSSProperties;

  const navigate = (feature: FeatureId) => {
    setActiveFeature(feature);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectCountry = (country: CountryId) => {
    setSelectedCountry(country);
    setCountrySelectorOpen(false);
  };

  const saveActivity = (dayId: string, activity: Activity) => {
    setItinerary((currentItinerary) => currentItinerary.map((day) => {
      if (day.id !== dayId) return day;
      const exists = day.activities.some((item) => item.id === activity.id);
      return {
        ...day,
        activities: exists
          ? day.activities.map((item) => item.id === activity.id ? activity : item)
          : [...day.activities, activity],
      };
    }));
  };

  const deleteActivity = (dayId: string, activityId: string) => {
    setItinerary((currentItinerary) => currentItinerary.map((day) =>
      day.id === dayId
        ? { ...day, activities: day.activities.filter((activity) => activity.id !== activityId) }
        : day,
    ));
  };

  const reorderActivity = (dayId: string, activityId: string, direction: -1 | 1) => {
    setItinerary((currentItinerary) => currentItinerary.map((day) => {
      if (day.id !== dayId) return day;
      const sourceIndex = day.activities.findIndex((activity) => activity.id === activityId);
      const targetIndex = sourceIndex + direction;
      if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= day.activities.length) return day;
      const activities = [...day.activities];
      [activities[sourceIndex], activities[targetIndex]] = [activities[targetIndex], activities[sourceIndex]];
      return { ...day, activities };
    }));
  };

  const updateDay = (dayId: string, update: Partial<TripDay>) => {
    setItinerary((currentItinerary) => currentItinerary.map((day) => {
      if (day.id !== dayId) return day;
      const date = update.date ?? day.date;
      return {
        ...day,
        ...update,
        ...(date !== day.date ? getDateLabels(date) : {}),
        activities: (update.activities ?? day.activities).map((activity) => ({ ...activity, date })),
      };
    }));
  };

  const updateBase = (updatedBase: TripBase) => {
    setBases((currentBases) => currentBases.map((base) => base.id === updatedBase.id ? updatedBase : base));
  };

  const moveLinkedReservations = (reservationIds: string[], targetDate: string) => {
    if (reservationIds.length === 0) return;
    setReservations((currentReservations) => currentReservations.map((reservation) =>
      reservationIds.includes(reservation.id)
        ? { ...reservation, dateISO: targetDate, date: formatReservationDate(targetDate) }
        : reservation,
    ));
  };

  const moveActivity = (sourceDayId: string, targetDayId: string, activityId: string, moveReservation: boolean) => {
    const sourceDay = itinerary.find((day) => day.id === sourceDayId);
    const targetDay = itinerary.find((day) => day.id === targetDayId);
    const movingActivity = sourceDay?.activities.find((activity) => activity.id === activityId);
    if (!sourceDay || !targetDay || !movingActivity) return;

    setItinerary((currentItinerary) => currentItinerary.map((day) => {
      if (day.id === sourceDayId) {
        return { ...day, activities: day.activities.filter((activity) => activity.id !== activityId) };
      }
      if (day.id === targetDayId) {
        return { ...day, activities: [...day.activities, { ...movingActivity, date: day.date }] };
      }
      return day;
    }));

    if (moveReservation && movingActivity.reservationId) {
      moveLinkedReservations([movingActivity.reservationId], targetDay.date);
    }
  };

  const swapDayPlans = (sourceDayId: string, targetDayId: string, moveReservations: boolean) => {
    const sourceDay = itinerary.find((day) => day.id === sourceDayId);
    const targetDay = itinerary.find((day) => day.id === targetDayId);
    if (!sourceDay || !targetDay) return;

    const planFields = ["area", "visitedCity", "dayType", "weather", "notes", "hiddenGem", "flexible"] as const;
    setItinerary((currentItinerary) => currentItinerary.map((day) => {
      if (day.id !== sourceDayId && day.id !== targetDayId) return day;
      const otherDay = day.id === sourceDayId ? targetDay : sourceDay;
      const swapped = { ...day };
      for (const field of planFields) {
        Object.assign(swapped, { [field]: otherDay[field] });
      }
      return {
        ...swapped,
        activities: otherDay.activities.map((activity) => ({ ...activity, date: day.date })),
      };
    }));

    if (moveReservations) {
      const sourceReservationIds = sourceDay.activities.flatMap((activity) => activity.reservationId ? [activity.reservationId] : []);
      const targetReservationIds = targetDay.activities.flatMap((activity) => activity.reservationId ? [activity.reservationId] : []);
      moveLinkedReservations(sourceReservationIds, targetDay.date);
      moveLinkedReservations(targetReservationIds, sourceDay.date);
    }
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

  const savePlace = (place: TripLocation) => {
    setSavedPlaces((currentPlaces) => {
      const existingIndex = currentPlaces.findIndex((item) =>
        place.placeId ? item.placeId === place.placeId : item.name === place.name,
      );
      if (existingIndex < 0) return [...currentPlaces, place];
      return currentPlaces.map((item, index) => index === existingIndex ? place : item);
    });
  };

  return (
    <div className="travel-shell" style={themeStyle}>
      <SideNavigation
        trip={trip}
        theme={theme}
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
          {activeFeature === "itinerary" ? (
            <ItineraryView
              itinerary={itinerary}
              bases={bases}
              flightSegments={initialTrip.flightSegments}
              reservations={reservations}
              onSaveActivity={saveActivity}
              onDeleteActivity={deleteActivity}
              onReorderActivity={reorderActivity}
              onUpdateDay={updateDay}
              onUpdateBase={updateBase}
              onMoveActivity={moveActivity}
              onSwapDayPlans={swapDayPlans}
            />
          ) : null}
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
              savedPlaces={savedPlaces}
              onSavePlace={savePlace}
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
