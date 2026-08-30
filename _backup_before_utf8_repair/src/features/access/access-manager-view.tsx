"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Check, Copy, FolderPlus, LoaderCircle, Mail, MessageCircle, RotateCcw, Settings2, Share2, ShieldOff, UserPlus, UsersRound, X } from "lucide-react";

import {
  TRIP_PERMISSION_HEADING,
  roleLabels,
  tripPermissionOptions,
  tripPermissionsOnly,
} from "@/lib/permissions/permission-model";
import {
  companionInvitationMessage,
  emailShareUrl,
  shareInvitation,
  travelerInvitationMessage,
  whatsappShareUrl,
  type ShareableInvitation,
} from "@/lib/invitations/invitation-sharing";
import type { AccessGuestWorkspace, AccessParticipant } from "@/types/cloud";

interface AccessManagerViewProps {
  currentParticipantId: string;
  currentTripName: string;
  canManageTripParticipants: boolean;
  canManagePlatformAccess: boolean;
  canCreateTravelerSpaces: boolean;
}

interface AccessResponse {
  participants?: AccessParticipant[];
  workspaces?: AccessGuestWorkspace[];
  error?: string;
  message?: string;
  pending?: boolean;
  invitation?: {
    type: "trip_companion" | "independent_traveler";
    setupUrl: string;
    setupExpiresAt?: string;
    targetName?: string;
    inviterName: string;
    tripName?: string;
  };
}

interface InvitationResult extends ShareableInvitation {
  targetName: string;
  expiresAt?: string;
}

function permissionsFromForm(form: FormData) {
  return tripPermissionsOnly(Object.fromEntries(
    tripPermissionOptions.map((item) => [item.id, form.get(item.id) === "on"]),
  ));
}

export function AccessManagerView({
  currentParticipantId,
  currentTripName,
  canManageTripParticipants,
  canManagePlatformAccess,
  canCreateTravelerSpaces,
}: AccessManagerViewProps) {
  const [participants, setParticipants] = useState<AccessParticipant[]>([]);
  const [workspaces, setWorkspaces] = useState<AccessGuestWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string>();
  const [companionOpen, setCompanionOpen] = useState(false);
  const [travelerOpen, setTravelerOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<AccessParticipant>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [invitation, setInvitation] = useState<InvitationResult>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/travel-access", { cache: "no-store" });
      const payload = await response.json() as AccessResponse;
      if (!response.ok || !payload.participants) {
        throw new Error(payload.error ?? "No se pudieron cargar los participantes.");
      }
      setParticipants(payload.participants);
      setWorkspaces(payload.workspaces ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron cargar los participantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const requestAccess = async (body: Record<string, unknown>, workingKey: string) => {
    setWorkingId(workingKey);
    setError(undefined);
    setNotice(undefined);
    try {
      const response = await fetch("/api/travel-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json() as AccessResponse;
      if (!response.ok) throw new Error(payload.error ?? "No se pudo actualizar el acceso.");
      setNotice(payload.message);
      await load();
      return payload;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo actualizar el acceso.");
      return undefined;
    } finally {
      setWorkingId(undefined);
    }
  };

  const prepareCompanion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const payload = await requestAccess({
      action: "createCompanionInvitation",
      name,
      permissions: permissionsFromForm(form),
      accessExpiresAt: String(form.get("accessExpiresAt") ?? ""),
    }, "new-companion");
    if (payload?.invitation) {
      setCompanionOpen(false);
      setInvitationResult(payload.invitation);
    }
  };

  const prepareTraveler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("travelerName") ?? "").trim();
    const payload = await requestAccess({ action: "createTravelerInvitation", name, accessExpiresAt: String(form.get("accessExpiresAt") ?? "") }, "new-traveler");
    if (payload?.invitation) {
      setTravelerOpen(false);
      setInvitationResult(payload.invitation);
    }
  };

  const updatePermissions = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingParticipant) return;
    const completed = await requestAccess({
      action: "updateTripPermissions",
      participantId: editingParticipant.id,
      permissions: permissionsFromForm(new FormData(event.currentTarget)),
    }, editingParticipant.id);
    if (completed) setEditingParticipant(undefined);
  };

  const setInvitationResult = (result: NonNullable<AccessResponse["invitation"]>) => {
    const targetName = result.targetName ?? "Viajero";
    const message = result.type === "trip_companion"
      ? companionInvitationMessage(result.inviterName, result.tripName ?? currentTripName, result.setupUrl)
      : travelerInvitationMessage(result.inviterName, result.setupUrl);
    setInvitation({
      setupUrl: result.setupUrl,
      targetName,
      expiresAt: result.setupExpiresAt,
      subject: result.type === "trip_companion" ? `Invitación a ${result.tripName ?? currentTripName} en NIOLI` : "Tu invitación a NIOLI",
      message,
    });
  };

  const copyInvitation = async () => {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.setupUrl);
      setNotice("Enlace copiado.");
    } catch {
      setError("No se pudo copiar automáticamente. Selecciona el enlace y cópialo manualmente.");
    }
  };

  const nativeShareInvitation = async () => {
    if (!invitation) return;
    const result = await shareInvitation(
      invitation,
      navigator.share ? navigator.share.bind(navigator) : undefined,
      (text) => navigator.clipboard.writeText(text),
    ).catch(() => "failed" as const);
    if (result === "copied") setNotice("Tu dispositivo no ofrece compartir; copiamos el enlace.");
    if (result === "failed") setError("No se pudo compartir. Usa Copiar enlace.");
  };

  const resetParticipant = async (participant: AccessParticipant) => {
    if (!window.confirm(`¿Crear un nuevo enlace de acceso para ${participant.name}? Sus sesiones actuales se cerrarán.`)) return;
    const payload = await requestAccess({ action: "resetCompanionPin", participantId: participant.id, name: participant.name }, participant.id);
    if (payload?.invitation) setInvitationResult(payload.invitation);
  };

  const resetTraveler = async (workspace: AccessGuestWorkspace) => {
    if (!window.confirm(`¿Crear un nuevo enlace de acceso para ${workspace.displayName}? Sus sesiones actuales se cerrarán.`)) return;
    const payload = await requestAccess({ action: "resetTravelerPin", workspaceId: workspace.id, name: workspace.displayName }, workspace.id);
    if (payload?.invitation) setInvitationResult(payload.invitation);
  };

  const revokeParticipant = (participant: AccessParticipant) => {
    if (!window.confirm(`¿Quitar a ${participant.name} de ${currentTripName}?`)) return;
    void requestAccess({ action: "revokeTripAccess", participantId: participant.id }, participant.id);
  };

  const revokeTraveler = (workspace: AccessGuestWorkspace) => {
    if (!window.confirm(`¿Revocar el acceso independiente de ${workspace.displayName}?`)) return;
    void requestAccess({ action: "revokeTravelerAccess", workspaceId: workspace.id }, workspace.id);
  };

  return (
    <div className="view-stack access-view">
      <header className="trips-heading">
        <div>
          <p className="eyebrow">{canManageTripParticipants ? "Participantes" : "Administrador de NIOLI"}</p>
          <h1>{canManageTripParticipants ? `Acompañantes de ${currentTripName}` : "Administración de accesos"}</h1>
          <p>{canManageTripParticipants ? "Administra quién puede colaborar en este viaje. El acceso no se extiende a otros viajes." : "Administra únicamente los accesos independientes autorizados para la plataforma."}</p>
        </div>
        <div className="heading-actions">
          {canCreateTravelerSpaces ? <button type="button" className="secondary-button" onClick={() => setTravelerOpen(true)}><FolderPlus size={18} /> Crear viajero independiente</button> : null}
          {canManageTripParticipants ? <button type="button" className="primary-button" onClick={() => setCompanionOpen(true)}><UserPlus size={18} /> Agregar acompañante</button> : null}
        </div>
      </header>

      {canManageTripParticipants ? <div className="mode-banner"><UsersRound size={19} /><div><strong>Acceso limitado a este viaje</strong><p>Las fotos, recuerdos, gastos privados, sellos desbloqueados y el progreso personal de cada viajero permanecen privados.</p></div></div> : null}
      {notice ? <p className="data-note" role="status"><Check size={14} /> {notice}</p> : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}

      {canManageTripParticipants && (loading ? <div className="empty-state compact"><LoaderCircle className="auth-spinner" size={28} /><p>Cargando participantes…</p></div> : (
        <section className="access-grid" aria-label={`Acompañantes de ${currentTripName}`}>
          {participants.map((participant) => (
            <article className="access-card" key={participant.id}>
              <span className="access-avatar">{participant.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
              <div><strong>{participant.name}</strong><small>{roleLabels[participant.role]}{participant.accessActive === false ? " · Invitación pendiente" : ""}</small></div>
              <div className="access-actions">
                {participant.id !== currentParticipantId && participant.role !== "owner" ? <>
                  {participant.accessActive !== false ? <button type="button" className="secondary-button" disabled={workingId === participant.id} onClick={() => setEditingParticipant(participant)}>{workingId === participant.id ? <LoaderCircle className="auth-spinner" size={15} /> : <Settings2 size={15} />} Administrar permisos</button> : null}
                  <button type="button" className="icon-button" aria-label={`Crear nuevo enlace de acceso para ${participant.name}`} disabled={workingId === participant.id} onClick={() => void resetParticipant(participant)}><RotateCcw size={17} /></button>
                  <button type="button" className="icon-button danger" aria-label={`Quitar a ${participant.name} de este viaje`} onClick={() => revokeParticipant(participant)}><ShieldOff size={17} /></button>
                </> : <span className="storage-pill"><Check size={12} /> Sesión actual</span>}
              </div>
            </article>
          ))}
        </section>
      ))}

      {canManagePlatformAccess ? <section className="view-stack" aria-labelledby="platform-access-title">
        <div className="subsection-heading"><div><p className="eyebrow">Administrador de NIOLI</p><h2 id="platform-access-title">Viajeros independientes</h2></div><span className="collection-count"><UsersRound size={16} /> {workspaces.length}</span></div>
        <p className="data-note">Cada viajero tendrá su propio espacio para crear y organizar viajes, sin acceso al contenido de otras personas.</p>
        {workspaces.length ? <div className="access-grid">{workspaces.map((workspace) => <article className="access-card" key={workspace.id}><span className="access-avatar"><UsersRound size={19} /></span><div><strong>{workspace.displayName}</strong><small>{workspace.active ? "Activo" : "Pendiente o revocado"}</small></div><div className="access-actions"><button type="button" className="icon-button" aria-label={`Crear nuevo enlace de acceso para ${workspace.displayName}`} disabled={workingId === workspace.id} onClick={() => void resetTraveler(workspace)}><RotateCcw size={17} /></button><button type="button" className="icon-button danger" aria-label={`Revocar acceso independiente de ${workspace.displayName}`} onClick={() => revokeTraveler(workspace)}><ShieldOff size={17} /></button></div></article>)}</div> : <div className="empty-state compact"><UsersRound size={28} /><h2>Sin viajeros independientes</h2><p>Los nuevos accesos se prepararán mediante una invitación segura.</p></div>}
      </section> : null}

      {companionOpen && canManageTripParticipants ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setCompanionOpen(false)}><section className="expense-modal access-modal" role="dialog" aria-modal="true" aria-labelledby="add-companion-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Este viaje</p><h2 id="add-companion-title">Agregar acompañante</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setCompanionOpen(false)}><X size={20} /></button></header><form onSubmit={(event) => void prepareCompanion(event)}><label>Nombre<input name="name" required autoFocus /></label><label>Vencimiento del acceso (opcional)<input type="datetime-local" name="accessExpiresAt" /></label><p className="data-note">Esta persona tendrá acceso únicamente a {currentTripName} y podrá colaborar según los permisos seleccionados. Sus fotos, gastos privados, recuerdos, sellos desbloqueados y progreso personal permanecerán privados.</p><PermissionFields /><button type="submit" className="primary-button full-width" disabled={workingId === "new-companion"}>Crear invitación</button></form></section></div> : null}

      {editingParticipant ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditingParticipant(undefined)}><section className="expense-modal access-modal" role="dialog" aria-modal="true" aria-labelledby="edit-permissions-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">{TRIP_PERMISSION_HEADING}</p><h2 id="edit-permissions-title">Permisos de {editingParticipant.name}</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setEditingParticipant(undefined)}><X size={20} /></button></header><form onSubmit={(event) => void updatePermissions(event)}><PermissionFields permissions={editingParticipant.permissions} /><button type="submit" className="primary-button full-width" disabled={workingId === editingParticipant.id}>Guardar permisos</button></form></section></div> : null}

      {travelerOpen && canCreateTravelerSpaces ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setTravelerOpen(false)}><section className="expense-modal access-modal" role="dialog" aria-modal="true" aria-labelledby="create-traveler-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Administrador de NIOLI</p><h2 id="create-traveler-title">Nuevo viajero</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setTravelerOpen(false)}><X size={20} /></button></header><form onSubmit={(event) => void prepareTraveler(event)}><label>Nombre del viajero<input name="travelerName" required autoFocus /></label><label>Vencimiento del acceso (opcional)<input type="datetime-local" name="accessExpiresAt" /></label><p className="data-note">Este usuario tendrá su propio espacio para crear y organizar viajes. No tendrá acceso a los viajes ni al contenido de otros usuarios. Sus recuerdos, fotos, gastos personales, sellos desbloqueados y progreso personal permanecen privados.</p><button type="submit" className="primary-button full-width" disabled={workingId === "new-traveler"}>Crear invitación</button></form></section></div> : null}

      {invitation ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setInvitation(undefined)}><section className="expense-modal access-modal invitation-result" role="dialog" aria-modal="true" aria-labelledby="invitation-ready-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Invitación lista</p><h2 id="invitation-ready-title">Comparte el acceso con {invitation.targetName}</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={() => setInvitation(undefined)}><X size={20} /></button></header><p>La persona elegirá su propio PIN al abrir este enlace. NIOLI no te mostrará ese PIN.</p><label>Enlace de invitación<input value={invitation.setupUrl} readOnly onFocus={(event) => event.currentTarget.select()} /></label><div className="invitation-share-grid"><button type="button" className="primary-button" onClick={() => void nativeShareInvitation()}><Share2 size={17} /> Compartir</button><a className="secondary-button" href={whatsappShareUrl(invitation)} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp</a><a className="secondary-button" href={emailShareUrl(invitation)}><Mail size={17} /> Email</a><button type="button" className="secondary-button" onClick={() => void copyInvitation()}><Copy size={17} /> Copiar enlace</button></div>{invitation.expiresAt ? <small>El enlace vence {new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(invitation.expiresAt))}.</small> : null}</section></div> : null}
    </div>
  );
}

function PermissionFields({ permissions = {} }: { permissions?: Record<string, boolean> }) {
  return <fieldset><legend>{TRIP_PERMISSION_HEADING}</legend>{tripPermissionOptions.map((item) => <label className="permission-check" key={item.id}><input type="checkbox" name={item.id} defaultChecked={permissions[item.id] === true || (Object.keys(permissions).length === 0 && item.id === "edit_itinerary")} /><span><strong>{item.label}</strong><small>{item.description}</small></span></label>)}</fieldset>;
}
