import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/mail", () => ({
	sendEmail: vi.fn(),
}));

import { sendEmail } from "@startkiter/mail";

import { sendOrganizationInvitationEmail } from "./organization-invitation-email";

describe("sendOrganizationInvitationEmail", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("delivers the Better Auth invitation through the mail package", async () => {
		await sendOrganizationInvitationEmail({
			email: "learner@example.com",
			id: "invitation-1",
			organizationName: "Acme",
			locale: "zh-tw",
			baseUrl: "https://startkiter.example",
			existingUser: false,
		});

		expect(sendEmail).toHaveBeenCalledWith({
			to: "learner@example.com",
			templateId: "organizationInvitation",
			locale: "zh-tw",
			context: {
				organizationName: "Acme",
				url: "https://startkiter.example/signup?invitationId=invitation-1&email=learner%40example.com",
			},
		});
	});
});
