import type { CloudRole } from "@/types/cloud";

export const PLATFORM_PERMISSION_KEYS = [
  "manage_platform_access",
  "create_traveler_spaces",
] as const;

export const TRIP_PERMISSION_KEYS = [
  "edit_itinerary",
  "manage_reservations",
  "create_stamps",
  "import_pdf",
  "manage_trip_participants",
  "manage_trip",
] as const;

export type PlatformPermissionKey = (typeof PLATFORM_PERMISSION_KEYS)[number];
export type TripPermissionKey = (typeof TRIP_PERMISSION_KEYS)[number];
export type PermissionMap = Record<string, boolean>;

export const TRIP_PERMISSION_HEADING = "PERMISOS EN ESTE VIAJE";

export const tripPermissionOptions: ReadonlyArray<{
  id: TripPermissionKey;
  label: string;
  description: string;
}> = [
  {
    id: "edit_itinerary",
    label: "Colaborar en el itinerario",
    description: "Puede agregar y editar actividades y organizar el itinerario de este viaje.",
  },
  {
    id: "manage_reservations",
    label: "Administrar reservas",
    description: "Puede agregar, editar y quitar reservas compartidas de este viaje.",
  },
  {
    id: "create_stamps",
    label: "Administrar Passport",
    description: "Puede administrar los sellos compartidos de este viaje. Los sellos personales siguen siendo privados.",
  },
  {
    id: "import_pdf",
    label: "Importar información",
    description: "Puede importar información compatible desde PDF únicamente para este viaje.",
  },
  {
    id: "manage_trip_participants",
    label: "Administrar acompañantes",
    description: "Puede agregar, configurar o quitar acompañantes únicamente de este viaje.",
  },
  {
    id: "manage_trip",
    label: "Administrar el viaje",
    description: "Puede editar la información general compartida de este viaje.",
  },
];

export const roleLabels: Record<CloudRole, string> = {
  owner: "Viajero principal",
  editor: "Organizador del viaje",
  participant: "Acompañante",
  viewer: "Acompañante con acceso de lectura",
};

export function hasExplicitPermission(
  permissions: PermissionMap | undefined,
  permission: string,
): boolean {
  return permissions?.[permission] === true;
}

export function isPlatformPermission(permission: string): permission is PlatformPermissionKey {
  return PLATFORM_PERMISSION_KEYS.some((key) => key === permission);
}

export function isTripPermission(permission: string): permission is TripPermissionKey {
  return TRIP_PERMISSION_KEYS.some((key) => key === permission);
}

export function hasPermission(
  role: CloudRole,
  permissions: PermissionMap | undefined,
  permission: string,
): boolean {
  if (isPlatformPermission(permission)) return hasExplicitPermission(permissions, permission);
  if (!isTripPermission(permission)) return false;
  return role === "owner" || hasExplicitPermission(permissions, permission);
}

export function canManagePlatformAccess(permissions: PermissionMap | undefined): boolean {
  return hasExplicitPermission(permissions, "manage_platform_access");
}

export function canCreateTravelerSpaces(permissions: PermissionMap | undefined): boolean {
  return hasExplicitPermission(permissions, "create_traveler_spaces");
}

export function canManageTripParticipants(
  role: CloudRole,
  permissions: PermissionMap | undefined,
): boolean {
  return role === "owner"
    || hasExplicitPermission(permissions, "manage_trip_participants");
}

export function canManageReservations(
  role: CloudRole,
  permissions: PermissionMap | undefined,
): boolean {
  return role === "owner"
    || hasExplicitPermission(permissions, "manage_reservations");
}

export function hasTripAccess(sessionTripId: string, requestedTripId: string): boolean {
  return sessionTripId === requestedTripId;
}

export function tripPermissionsOnly(input: unknown): Record<TripPermissionKey, boolean> {
  const source = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  return Object.fromEntries(
    TRIP_PERMISSION_KEYS.map((key) => [key, source[key] === true]),
  ) as Record<TripPermissionKey, boolean>;
}
