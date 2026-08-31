import { toastError } from "@startkiter/ui/components/toast";

export function notifyOrganizationInvitationFailure(t: (key: string) => string) {
	toastError(t("organizations.invitationModal.error"));
}
