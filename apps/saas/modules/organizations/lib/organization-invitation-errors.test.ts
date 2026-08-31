import { describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/ui/components/toast", () => ({
	toastError: vi.fn(),
}));

import { toastError } from "@startkiter/ui/components/toast";

import { notifyOrganizationInvitationFailure } from "./organization-invitation-errors";

describe("notifyOrganizationInvitationFailure", () => {
	it("shows a toast instead of silently swallowing invitation errors", () => {
		const t = (key: string) => key;

		notifyOrganizationInvitationFailure(t);

		expect(toastError).toHaveBeenCalledWith("organizations.invitationModal.error");
	});
});
