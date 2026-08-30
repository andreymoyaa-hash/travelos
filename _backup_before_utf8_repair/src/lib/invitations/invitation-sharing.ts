export interface ShareableInvitation {
  setupUrl: string;
  message: string;
  subject: string;
}

export function companionInvitationMessage(
  inviterName: string,
  tripName: string,
  setupUrl: string,
) {
  return `${inviterName} te invitó a acompañarle en ${tripName} usando NIOLI.\nAbre este enlace para configurar tu acceso:\n${setupUrl}`;
}

export function travelerInvitationMessage(inviterName: string, setupUrl: string) {
  return `${inviterName} preparó tu espacio de NIOLI.\nAbre este enlace para configurar tu acceso:\n${setupUrl}`;
}

export function whatsappShareUrl(invitation: ShareableInvitation) {
  return `https://wa.me/?text=${encodeURIComponent(invitation.message)}`;
}

export function emailShareUrl(invitation: ShareableInvitation) {
  return `mailto:?subject=${encodeURIComponent(invitation.subject)}&body=${encodeURIComponent(invitation.message)}`;
}

export async function shareInvitation(
  invitation: ShareableInvitation,
  nativeShare: ((data: ShareData) => Promise<void>) | undefined,
  copyFallback: (text: string) => Promise<void>,
) {
  if (nativeShare) {
    try {
      await nativeShare({
        title: invitation.subject,
        text: invitation.message,
        url: invitation.setupUrl,
      });
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled" as const;
      }
    }
  }
  await copyFallback(invitation.setupUrl);
  return "copied" as const;
}
