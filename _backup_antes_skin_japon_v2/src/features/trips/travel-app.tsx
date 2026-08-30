"use client";

import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";

import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { SideNavigation } from "@/components/navigation/side-navigation";
import { TopBar } from "@/components/navigation/top-bar";
import { companionProfileForCountry } from "@/data/companion-profiles";
import { passportTemplateForCountry } from "@/data/passport-templates";
import { AccessManagerView } from "@/features/access/access-manager-view";
import { AdventureView } from "@/features/achievements/adventure-view";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { ExpensesView } from "@/features/expenses/expenses-view";
import { ItineraryView } from "@/features/itinerary/itinerary-view";
import { MapView } from "@/features/maps/map-view";
import { useGeolocation } from "@/features/maps/use-geolocation";
import { PhotoCapture } from "@/features/photos/photo-capture";
import { ReservationsView } from "@/features/reservations/reservations-view";
import { TripManagerView } from "@/features/trips/trip-manager-view";
import { tripRepository, type CreateTripInput } from "@/repositories/trip-repository";
import { cloudTripRepository } from "@/repositories/cloud-trip-repository";
import { getCountryExperience } from "@/lib/nioli/country-experience";
import { officialBradyAsset, officialStampAssets } from "@/lib/nioli/official-assets";
import { withOfficialPassportCatalog } from "@/lib/nioli/passport-catalog";
import { applyPlannedPdfImport, type TravelPdfImportPreview } from "@/lib/imports/travel-os-pdf";
import { canCreateTravelerSpaces, canManagePlatformAccess, canManageReservations, canManageTripParticipants, hasExplicitPermission } from "@/lib/permissions/permission-model";
import type { TravelSession } from "@/types/cloud";
import type { Activity, Achievement, Budget, Expense, FeatureId, GeoPosition, Participant, Reservation, TravelPhoto, Trip, TripBase, TripDay, TripLocation } from "@/types/travel";

const isInJapan = ({ latitude, longitude }: GeoPosition) => latitude >= 24 && latitude <= 46 && longitude >= 122 && longitude <= 146;
const distanceInMeters = (position: GeoPosition, target: { latitude: number; longitude: number }) => {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(target.latitude - position.latitude);
  const longitudeDelta = toRadians(target.longitude - position.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(position.latitude)) * Math.cos(toRadians(target.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const shortWeekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const shortMonths = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const getDateLabels = (date: string) => {
  const parsed = new Date(`${date}T12:00:00Z`);
  return { weekday: shortWeekdays[parsed.getUTCDay()], dayNumber: date.slice(-2), month: shortMonths[parsed.getUTCMonth()] };
};
const formatReservationDate = (date: string) => {
  const labels = getDateLabels(date);
  return `${labels.dayNumber} ${labels.month}`;
};
const formatTripRange = (startDate: string, endDate: string) => {
  const formatter = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${formatter.format(new Date(`${startDate}T12:00:00Z`))} — ${formatter.format(new Date(`${endDate}T12:00:00Z`))}`;
};
const initialsFor = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "VJ";
const participantColors = ["#6f56b7", "#df5753", "#0c8f69", "#d97732", "#2d6685", "#b15a73"];

export function TravelApp({ initialTrip, cloudSession, onLogout }: { initialTrip: Trip; cloudSession?: TravelSession; onLogout?: () => Promise<void> }) {
  const normalizedInitialTrip = useMemo(() => withOfficialPassportCatalog(initialTrip), [initialTrip]);
  const [trips, setTrips] = useState<Trip[]>([normalizedInitialTrip]);
  const [activeTripId, setActiveTripId] = useState(normalizedInitialTrip.id);
  const [activeFeature, setActiveFeature] = useState<FeatureId>("dashboard");
  const [activeParticipantId, setActiveParticipantId] = useState(cloudSession?.participant.id ?? normalizedInitialTrip.participants[0].id);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraContext, setCameraContext] = useState<{ dayId?: string; achievementId?: string }>({});
  const [cloudError, setCloudError] = useState<string>();
  const { position, status: locationStatus, error: locationError, requestLocation } = useGeolocation();

  useEffect(() => {
    if (cloudSession) {
      const frame = window.requestAnimationFrame(() => {
        setTrips([normalizedInitialTrip]);
        setActiveTripId(normalizedInitialTrip.id);
        setActiveParticipantId(cloudSession.participant.id);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    const storedTrips = tripRepository.getTrips(normalizedInitialTrip);
    const storedActiveId = tripRepository.getActiveTripId();
    const nextId = storedTrips.some((trip) => trip.id === storedActiveId) ? storedActiveId! : normalizedInitialTrip.id;
    const active = storedTrips.find((trip) => trip.id === nextId) ?? storedTrips[0];
    const frame = window.requestAnimationFrame(() => {
      setTrips(storedTrips);
      setActiveTripId(nextId);
      setActiveParticipantId(active.participants[0]?.id ?? "");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [cloudSession, normalizedInitialTrip]);

  const trip = trips.find((item) => item.id === activeTripId) ?? trips[0] ?? normalizedInitialTrip;
  const experience = getCountryExperience(trip.countryId);
  const theme = experience.theme;
  const activeParticipant = trip.participants.find((participant) => participant.id === activeParticipantId) ?? trip.participants[0];
  const companionProfile = experience.companionProfile;
  const companionProgress = trip.companionProgress ?? { level: 1, xp: 0, mood: "curious" as const, enabled: true };
  const floatingBradyAsset = officialBradyAsset(trip.countryId);
  const dashboardStampAsset = officialStampAssets(trip.countryId)[0] ?? experience.assets.stamps.primary ?? experience.assets.stamps.items[0] ?? null;
  const spentInBudgetCurrency = trip.expenses.filter((expense) => expense.currency === trip.budget.currency).reduce((sum, expense) => sum + expense.amount, 0);
  const canImportPdf = !cloudSession || cloudSession.participant.role === "owner" || hasExplicitPermission(cloudSession.permissions, "import_pdf");
  const canEditReservations = !cloudSession || canManageReservations(cloudSession.participant.role, cloudSession.permissions);
  const canManageParticipants = Boolean(cloudSession && canManageTripParticipants(cloudSession.participant.role, cloudSession.permissions));
  const canManagePlatform = Boolean(cloudSession && canManagePlatformAccess(cloudSession.permissions));
  const canCreateTravelers = Boolean(cloudSession && canCreateTravelerSpaces(cloudSession.permissions));
  const canOpenAccess = canManageParticipants || canManagePlatform || canCreateTravelers;

  const themeStyle = {
    "--accent": theme.colors.accent, "--accent-dark": theme.colors.accentDark, "--accent-soft": theme.colors.soft,
    "--highlight": theme.colors.highlight, "--ink": theme.colors.ink, "--paper": theme.colors.paper,
    "--surface": theme.colors.surface, "--secondary": theme.colors.secondary, "--nature": theme.colors.nature,
    "--cultural": theme.colors.cultural, "--premium": theme.colors.premium, "--route-travel": theme.routeColors.travel,
    "--route-transition": theme.routeColors.transition, "--route-base-1": theme.routeColors.bases[0],
    "--route-base-2": theme.routeColors.bases[1], "--route-base-3": theme.routeColors.bases[2], "--route-base-4": theme.colors.cultural,
  } as CSSProperties;

  const updateActiveTrip = useCallback((update: (current: Trip) => Trip) => {
    setTrips((currentTrips) => currentTrips.map((currentTrip) => {
      if (currentTrip.id !== activeTripId) return currentTrip;
      const nextTrip = update(currentTrip);
      if (cloudSession) cloudTripRepository.saveTripData(nextTrip);
      else tripRepository.saveTripData(nextTrip, normalizedInitialTrip);
      return nextTrip;
    }));
  }, [activeTripId, cloudSession, normalizedInitialTrip]);

  const navigate = (feature: FeatureId) => {
    setActiveFeature(feature);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openTrip = (id: string) => {
    const nextTrip = trips.find((item) => item.id === id);
    if (!nextTrip) return;
    setActiveTripId(id);
    tripRepository.setActiveTripId(id);
    setActiveParticipantId(nextTrip.participants[0]?.id ?? "");
    setActiveFeature("dashboard");
  };

  const createTrip = (input: CreateTripInput) => {
    const created = tripRepository.createTrip(input, normalizedInitialTrip);
    setTrips(tripRepository.getTrips(normalizedInitialTrip));
    setActiveTripId(created.id);
    tripRepository.setActiveTripId(created.id);
    setActiveParticipantId(created.participants[0]?.id ?? "");
    setActiveFeature("dashboard");
  };

  const updateTripSettings = (updated: Trip, participantNames: string[]) => {
    const currentByName = new Map(updated.participants.map((participant) => [participant.name.toLocaleLowerCase(), participant]));
    const participants: Participant[] = Array.from(new Set(participantNames.map((name) => name.trim()).filter(Boolean))).map((name, index) => currentByName.get(name.toLocaleLowerCase()) ?? {
      id: `participant-${crypto.randomUUID()}`, name, initials: initialsFor(name), color: participantColors[index % participantColors.length],
    });
    const countryChanged = updated.countryId !== trip.countryId;
    const passportTemplate = passportTemplateForCountry(updated.countryId);
    const profile = companionProfileForCountry(updated.countryId);
    const nextTrip: Trip = {
      ...updated,
      participants,
      dateRange: formatTripRange(updated.startDate, updated.endDate),
      countdownDays: Math.max(0, Math.ceil((Date.parse(`${updated.startDate}T00:00:00Z`) - Date.now()) / 86400000)),
      route: [updated.settings?.initialCity ?? updated.currentCity],
      achievements: countryChanged ? structuredClone(passportTemplate.stamps) : updated.achievements,
      companionProgress: countryChanged ? { level: 1, xp: 0, mood: "curious", enabled: true } : updated.companionProgress,
      settings: {
        ...(updated.settings ?? { creatorName: participants[0]?.name ?? "Viajero", destinationTimeZone: updated.timezones.destination, storageMode: "local" as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
        passportTemplateId: passportTemplate.id, companionProfileId: profile.id, updatedAt: new Date().toISOString(),
      },
    };
    const saved = tripRepository.updateTrip(nextTrip, normalizedInitialTrip);
    setTrips((current) => current.map((item) => item.id === saved.id ? saved : item));
    if (!participants.some((participant) => participant.id === activeParticipantId)) setActiveParticipantId(participants[0]?.id ?? "");
  };

  const deleteTrip = (id: string) => {
    tripRepository.deleteTrip(id, normalizedInitialTrip);
    setTrips(tripRepository.getTrips(normalizedInitialTrip));
    if (id === activeTripId) {
      setActiveTripId(normalizedInitialTrip.id);
      tripRepository.setActiveTripId(normalizedInitialTrip.id);
      setActiveParticipantId(normalizedInitialTrip.participants[0].id);
    }
  };

  const saveActivity = (dayId: string, activity: Activity) => updateActiveTrip((current) => ({
    ...current,
    itinerary: current.itinerary.map((day) => day.id !== dayId ? day : { ...day, activities: day.activities.some((item) => item.id === activity.id) ? day.activities.map((item) => item.id === activity.id ? activity : item) : [...day.activities, activity] }),
  }));
  const deleteActivity = (dayId: string, activityId: string) => updateActiveTrip((current) => ({ ...current, itinerary: current.itinerary.map((day) => day.id === dayId ? { ...day, activities: day.activities.filter((activity) => activity.id !== activityId) } : day) }));
  const reorderActivity = (dayId: string, activityId: string, direction: -1 | 1) => updateActiveTrip((current) => ({ ...current, itinerary: current.itinerary.map((day) => {
    if (day.id !== dayId) return day;
    const sourceIndex = day.activities.findIndex((activity) => activity.id === activityId);
    const targetIndex = sourceIndex + direction;
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= day.activities.length) return day;
    const activities = [...day.activities];
    [activities[sourceIndex], activities[targetIndex]] = [activities[targetIndex], activities[sourceIndex]];
    return { ...day, activities };
  }) }));
  const updateDay = (dayId: string, update: Partial<TripDay>) => updateActiveTrip((current) => ({ ...current, itinerary: current.itinerary.map((day) => {
    if (day.id !== dayId) return day;
    const date = update.date ?? day.date;
    return { ...day, ...update, ...(date !== day.date ? getDateLabels(date) : {}), activities: (update.activities ?? day.activities).map((activity) => ({ ...activity, date })) };
  }) }));
  const addDay = (day: TripDay) => updateActiveTrip((current) => ({ ...current, itinerary: [...current.itinerary, day].sort((a, b) => a.date.localeCompare(b.date)) }));
  const importPdf = (preview: TravelPdfImportPreview) => updateActiveTrip((current) => applyPlannedPdfImport(current, preview));
  const updateBase = (updatedBase: TripBase) => updateActiveTrip((current) => ({ ...current, bases: current.bases.map((base) => base.id === updatedBase.id ? updatedBase : base) }));

  const moveLinkedReservations = (reservationIds: string[], targetDate: string) => {
    if (!reservationIds.length) return;
    updateActiveTrip((current) => ({ ...current, reservations: current.reservations.map((reservation) => reservationIds.includes(reservation.id) ? { ...reservation, dateISO: targetDate, date: formatReservationDate(targetDate) } : reservation) }));
  };
  const moveActivity = (sourceDayId: string, targetDayId: string, activityId: string, moveReservation: boolean) => {
    const sourceDay = trip.itinerary.find((day) => day.id === sourceDayId);
    const targetDay = trip.itinerary.find((day) => day.id === targetDayId);
    const movingActivity = sourceDay?.activities.find((activity) => activity.id === activityId);
    if (!sourceDay || !targetDay || !movingActivity) return;
    updateActiveTrip((current) => ({ ...current, itinerary: current.itinerary.map((day) => day.id === sourceDayId ? { ...day, activities: day.activities.filter((activity) => activity.id !== activityId) } : day.id === targetDayId ? { ...day, activities: [...day.activities, { ...movingActivity, date: day.date }] } : day) }));
    if (moveReservation && movingActivity.reservationId) moveLinkedReservations([movingActivity.reservationId], targetDay.date);
  };
  const swapDayPlans = (sourceDayId: string, targetDayId: string, moveReservations: boolean) => {
    const sourceDay = trip.itinerary.find((day) => day.id === sourceDayId);
    const targetDay = trip.itinerary.find((day) => day.id === targetDayId);
    if (!sourceDay || !targetDay) return;
    const planFields = ["area", "visitedCity", "dayType", "weather", "notes", "hiddenGem", "flexible"] as const;
    updateActiveTrip((current) => ({ ...current, itinerary: current.itinerary.map((day) => {
      if (day.id !== sourceDayId && day.id !== targetDayId) return day;
      const otherDay = day.id === sourceDayId ? targetDay : sourceDay;
      const swapped = { ...day };
      for (const field of planFields) Object.assign(swapped, { [field]: otherDay[field] });
      return { ...swapped, activities: otherDay.activities.map((activity) => ({ ...activity, date: day.date })) };
    }) }));
    if (moveReservations) {
      moveLinkedReservations(sourceDay.activities.flatMap((activity) => activity.reservationId ? [activity.reservationId] : []), targetDay.date);
      moveLinkedReservations(targetDay.activities.flatMap((activity) => activity.reservationId ? [activity.reservationId] : []), sourceDay.date);
    }
  };

  const updateAchievementForParticipant = useCallback((id: string, participantId: string, unlocked: boolean, photoId?: string) => updateActiveTrip((current) => ({
    ...current,
    achievements: current.achievements.map((achievement) => achievement.id !== id ? achievement : {
      ...achievement,
      unlockedBy: unlocked ? Array.from(new Set([...achievement.unlockedBy, participantId])) : achievement.unlockedBy.filter((currentId) => currentId !== participantId),
      unlockedAt: unlocked ? { ...achievement.unlockedAt, [participantId]: new Date().toISOString() } : achievement.unlockedAt,
      unlockedPhotoIds: photoId ? { ...achievement.unlockedPhotoIds, [participantId]: photoId } : achievement.unlockedPhotoIds,
    }),
    companionProgress: unlocked ? { ...(current.companionProgress ?? { level: 1, xp: 0, mood: "curious", enabled: true }), xp: (current.companionProgress?.xp ?? 0) + 25, level: 1 + Math.floor(((current.companionProgress?.xp ?? 0) + 25) / 100), mood: "excited", lastMessage: "¡Nuevo sello conseguido!" } : current.companionProgress,
  })), [updateActiveTrip]);
  const toggleAchievement = (id: string) => {
    if (!activeParticipant) return;
    const achievement = trip.achievements.find((item) => item.id === id);
    if (achievement) updateAchievementForParticipant(id, activeParticipant.id, !achievement.unlockedBy.includes(activeParticipant.id));
  };
  const addAchievement = (achievement: Achievement) => updateActiveTrip((current) => ({ ...current, achievements: [...current.achievements, achievement] }));

  const requestCurrentLocation = useCallback(async () => {
    const nextPosition = await requestLocation();
    if (!nextPosition || !activeParticipant) return nextPosition;
    updateActiveTrip((current) => ({ ...current, achievements: current.achievements.map((achievement) => {
      const reachedCountry = current.countryId === "japan" && achievement.id === "reach-japan" && isInJapan(nextPosition);
      const reachedTrigger = achievement.geoTriggers?.some((trigger) => distanceInMeters(nextPosition, trigger) <= trigger.radiusMeters);
      return reachedCountry || reachedTrigger ? { ...achievement, unlockedBy: Array.from(new Set([...achievement.unlockedBy, activeParticipant.id])), unlockedAt: { ...achievement.unlockedAt, [activeParticipant.id]: new Date().toISOString() } } : achievement;
    }) }));
    return nextPosition;
  }, [activeParticipant, requestLocation, updateActiveTrip]);

  const addPhoto = (photo: TravelPhoto) => {
    const memory = { ...photo, tripId: trip.id };
    setCloudError(undefined);
    updateActiveTrip((current) => ({ ...current, photos: [memory, ...current.photos], companionProgress: { ...(current.companionProgress ?? { level: 1, xp: 0, mood: "curious", enabled: true }), xp: (current.companionProgress?.xp ?? 0) + 10, level: 1 + Math.floor(((current.companionProgress?.xp ?? 0) + 10) / 100), mood: "happy", lastMessage: "¡Qué buen recuerdo!" } }));
    if (memory.achievementId) updateAchievementForParticipant(memory.achievementId, memory.participantId, true, memory.id);
    if (cloudSession) {
      void cloudTripRepository.uploadPhoto(memory)
        .then((uploaded) => updateActiveTrip((current) => ({ ...current, photos: current.photos.map((item) => item.id === memory.id ? uploaded : item) })))
        .catch(() => setCloudError("La foto se conservó en este dispositivo, pero no se pudo subir a Cloud Mode."));
    }
  };
  const savePlace = (place: TripLocation) => updateActiveTrip((current) => {
    const scopedPlace = { ...place, id: place.id ?? `place-${crypto.randomUUID()}`, tripId: current.id };
    const existingIndex = current.savedPlaces.findIndex((item) => scopedPlace.placeId ? item.placeId === scopedPlace.placeId : item.name === scopedPlace.name);
    return { ...current, savedPlaces: existingIndex < 0 ? [...current.savedPlaces, scopedPlace] : current.savedPlaces.map((item, index) => index === existingIndex ? scopedPlace : item) };
  });

  const companionAction = (action: "snack" | "hello" | "memory" | "explore") => updateActiveTrip((current) => {
    const messages = {
      snack: "¡Gracias por el snack! Estoy listo para seguir.",
      hello: current.currentCity ? `Hoy hay bastante por explorar en ${current.currentCity}.` : "¡Hola! Podemos empezar cuando quieras.",
      memory: current.photos.length ? `Ya guardamos ${current.photos.length} recuerdo${current.photos.length === 1 ? "" : "s"}.` : "La cámara está lista para tu primer recuerdo.",
      explore: current.itinerary[0]?.area ? `El próximo plan registrado es ${current.itinerary[0].area}.` : "Agrega un día al itinerario para empezar a explorar.",
    };
    const progress = current.companionProgress ?? { level: 1, xp: 0, mood: "curious" as const, enabled: true };
    return { ...current, companionProgress: { ...progress, mood: action === "snack" ? "happy" : "curious", lastMessage: messages[action], lastInteractionAt: new Date().toISOString() } };
  });

  const openCamera = (context: { dayId?: string; achievementId?: string } = {}) => { setCameraContext(context); setCameraOpen(true); };
  const photoDays = useMemo(() => trip.itinerary.map((day) => ({ id: day.id, label: `${day.date} · ${day.area}`, activities: day.activities })), [trip.itinerary]);

  return (
    <div className="travel-shell" style={themeStyle} data-country-style={theme.decorativeStyle} data-country-id={trip.countryId}>
      <SideNavigation trip={trip} theme={theme} active={activeFeature} companionEnabled={companionProgress.enabled} companionProfile={companionProfile} companionProgress={companionProgress} cloudMode={Boolean(cloudSession)} canManageAccess={canOpenAccess} onLogout={onLogout} brand={experience.brand} onNavigate={navigate} onToggleCompanion={() => updateActiveTrip((current) => ({ ...current, companionProgress: { ...(current.companionProgress ?? companionProgress), enabled: !companionProgress.enabled } }))} />
      <div className="app-stage">
        <TopBar trip={trip} theme={theme} activeParticipantId={activeParticipant?.id ?? ""} participantLocked={Boolean(cloudSession)} onLogout={onLogout} brand={experience.brand} onSelectParticipant={setActiveParticipantId} onOpenCountries={!cloudSession || canOpenAccess ? () => navigate("trips") : undefined} />
        <main className="app-main">
          {cloudError ? <p className="auth-error" role="status">{cloudError}</p> : null}
          {activeFeature === "trips" && cloudSession && canOpenAccess ? <AccessManagerView currentParticipantId={cloudSession.participant.id} currentTripName={cloudSession.trip.name} canManageTripParticipants={canManageParticipants} canManagePlatformAccess={canManagePlatform} canCreateTravelerSpaces={canCreateTravelers} /> : null}
          {activeFeature === "trips" && !cloudSession ? <TripManagerView trips={trips} activeTripId={activeTripId} onOpenTrip={openTrip} onCreateTrip={createTrip} onUpdateTrip={updateTripSettings} onDeleteTrip={deleteTrip} /> : null}
          {activeFeature === "dashboard" && activeParticipant ? <DashboardView trip={trip} theme={theme} participant={activeParticipant} spent={spentInBudgetCurrency} onNavigate={navigate} onOpenCamera={() => openCamera()} bradyAsset={floatingBradyAsset} stampAsset={dashboardStampAsset} /> : null}
          {activeFeature === "itinerary" ? <ItineraryView trip={trip} itinerary={trip.itinerary} bases={trip.bases} flightSegments={trip.flightSegments} reservations={trip.reservations} canImportPdf={canImportPdf} onImportPdf={importPdf} onAddDay={addDay} onOpenCamera={(dayId) => openCamera({ dayId })} onSaveActivity={saveActivity} onDeleteActivity={deleteActivity} onReorderActivity={reorderActivity} onUpdateDay={updateDay} onUpdateBase={updateBase} onMoveActivity={moveActivity} onSwapDayPlans={swapDayPlans} /> : null}
          {activeFeature === "expenses" && activeParticipant ? <ExpensesView trip={trip} expenses={trip.expenses} activeParticipant={activeParticipant} onAddExpense={(expense: Expense) => updateActiveTrip((current) => ({ ...current, expenses: [expense, ...current.expenses] }))} onUpdateBudget={(budget: Budget) => updateActiveTrip((current) => ({ ...current, budget }))} /> : null}
          {activeFeature === "reservations" ? <ReservationsView reservations={trip.reservations} startDate={trip.startDate} endDate={trip.endDate} canManage={canEditReservations} onAddReservation={(reservation: Reservation) => updateActiveTrip((current) => ({ ...current, reservations: [reservation, ...current.reservations] }))} /> : null}
          {activeFeature === "map" ? <MapView trip={trip} position={position} locationStatus={locationStatus} locationError={locationError} onRequestLocation={requestCurrentLocation} savedPlaces={trip.savedPlaces} onSavePlace={savePlace} /> : null}
          {activeFeature === "adventure" && activeParticipant ? <AdventureView trip={trip} theme={theme} achievements={trip.achievements} participant={activeParticipant} photos={trip.photos.filter((photo) => photo.participantId === activeParticipant.id)} position={position} locationStatus={locationStatus} locationError={locationError} companionProfile={companionProfile} companionProgress={companionProgress} onRequestLocation={requestCurrentLocation} onSavePhoto={addPhoto} onToggleAchievement={toggleAchievement} onAddAchievement={addAchievement} onCompanionAction={companionAction} onOpenCamera={(achievementId) => openCamera({ achievementId })} /> : null}
        </main>
      </div>
      {companionProgress.enabled && activeFeature !== "adventure" && activeFeature !== "trips" ? <button type="button" className="floating-companion" onClick={() => navigate("adventure")} aria-label="Abrir compañero de viaje"><span className="floating-brady" aria-hidden="true">{floatingBradyAsset ? <Image src={floatingBradyAsset} alt="" width={46} height={46} /> : companionProfile.icon}</span><small>{companionProgress.mood === "excited" ? "¡Nuevo sello!" : "Explorar"}</small></button> : null}
      {activeFeature !== "trips" && activeFeature !== "adventure" ? <button type="button" className="floating-camera" onClick={() => openCamera()} aria-label={`Tomar foto desde ${activeFeature}`}><Camera size={20} /><span>Foto</span></button> : null}
      <BottomNavigation active={activeFeature} onNavigate={navigate} showTrips={!cloudSession || canOpenAccess} tripsLabel={cloudSession ? "Participantes" : "Mis viajes"} onLogout={onLogout} />
      {activeParticipant ? <PhotoCapture key={`${trip.id}-${cameraContext.achievementId ?? "none"}-${cameraContext.dayId ?? "none"}`} open={cameraOpen} tripId={trip.id} participant={activeParticipant} achievements={trip.achievements} days={photoDays} savedPlaces={trip.savedPlaces} position={position} initialAchievementId={cameraContext.achievementId} initialDayId={cameraContext.dayId} onClose={() => { setCameraOpen(false); setCameraContext({}); }} onSave={addPhoto} /> : null}
    </div>
  );
}
