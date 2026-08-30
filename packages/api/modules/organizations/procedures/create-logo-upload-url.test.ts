import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	getOrganizationById: vi.fn(),
}));

vi.mock("@startkiter/storage", () => ({
	getSignedUploadUrl: vi.fn(),
}));

vi.mock("../lib/membership", () => ({
	verifyOrganizationMembership: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { getOrganizationById } from "@startkiter/database";
import { getSignedUploadUrl } from "@startkiter/storage";

import { verifyOrganizationMembership } from "../lib/membership";
import { createLogoUploadUrl } from "./create-logo-upload-url";

const memberSession = {
	session: { id: "session-1", userId: "user-1" },
	user: { id: "user-1", email: "member@example.com", role: "user" },
};

const organization = {
	id: "org-42",
	name: "StartKiter",
	slug: "startkiter",
};

describe("createLogoUploadUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(memberSession as never);
		vi.mocked(getOrganizationById).mockResolvedValue(organization as never);
		vi.mocked(verifyOrganizationMembership).mockResolvedValue({
			organization,
			role: "owner",
		} as never);
		vi.mocked(getSignedUploadUrl).mockResolvedValue("https://storage.example/upload?signed=1");
	});

	it("issues a path bound to the organization id and asks storage for an avatars upload URL", async () => {
		await expect(
			call(createLogoUploadUrl, { organizationId: "org-42" }, { context: { headers: new Headers() } }),
		).resolves.toEqual({
			signedUploadUrl: "https://storage.example/upload?signed=1",
			path: "org-42.png",
		});

		expect(getSignedUploadUrl).toHaveBeenCalledWith("org-42.png", { bucket: "avatars" });
		expect(verifyOrganizationMembership).toHaveBeenCalledWith("org-42", "user-1");
	});

	it("rejects a caller who is not a member of the organization", async () => {
		vi.mocked(verifyOrganizationMembership).mockResolvedValueOnce(null);

		await expect(
			call(createLogoUploadUrl, { organizationId: "org-42" }, { context: { headers: new Headers() } }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		expect(getSignedUploadUrl).not.toHaveBeenCalled();
	});

	it("does not issue an upload URL for a missing organization", async () => {
		vi.mocked(getOrganizationById).mockResolvedValueOnce(null);

		await expect(
			call(createLogoUploadUrl, { organizationId: "missing-org" }, { context: { headers: new Headers() } }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		expect(getSignedUploadUrl).not.toHaveBeenCalled();
	});
});
