import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: { media: { create: vi.fn() } },
}));

vi.mock("@startkiter/storage", () => ({
	getSignedUploadUrl: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { getSignedUploadUrl } from "@startkiter/storage";

import { mediaUploadUrl } from "./media-upload-url";

const operatorSession = {
	session: { id: "session-1", userId: "operator-1" },
	user: { id: "operator-1", email: "operator@example.com", role: "user" },
};

const uploadInput = {
	filename: "cover.png",
	mimeType: "image/png",
	size: 2048,
};

describe("mediaUploadUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue(operatorSession as never);
		vi.mocked(getSignedUploadUrl).mockResolvedValue("https://storage.example/media-upload");
	});

	it("binds the object key to the current operator id", async () => {
		const result = await call(mediaUploadUrl, uploadInput, { context: { headers: new Headers() } });

		expect(result.path).toMatch(/^media\/operator-1\/[a-f0-9-]+\.png$/);
		expect(getSignedUploadUrl).toHaveBeenCalledWith(result.path, {
			bucket: "media",
			contentType: "image/png",
			contentLength: 2048,
			ifNoneMatch: true,
		});
	});

	it("rejects a non-operator before any signed URL is issued", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-2", userId: "instructor-1" },
			user: { id: "instructor-1", email: "instructor@example.com", role: "user" },
		} as never);

		await expect(
			call(mediaUploadUrl, uploadInput, { context: { headers: new Headers() } }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		expect(getSignedUploadUrl).not.toHaveBeenCalled();
	});
});
