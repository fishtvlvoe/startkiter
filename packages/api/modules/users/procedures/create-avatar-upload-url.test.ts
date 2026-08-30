import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/storage", () => ({
	getSignedUploadUrl: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { getSignedUploadUrl } from "@startkiter/storage";

import { createAvatarUploadUrl } from "./create-avatar-upload-url";

describe("createAvatarUploadUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getSignedUploadUrl).mockResolvedValue("https://storage.example/avatar-upload");
	});

	it("binds the object key to the authenticated user and ignores any other identity", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-1", userId: "user-aaa" },
			user: { id: "user-aaa", email: "aaa@example.com", role: "user" },
		} as never);

		await expect(
			call(createAvatarUploadUrl, {}, { context: { headers: new Headers() } }),
		).resolves.toEqual({
			signedUploadUrl: "https://storage.example/avatar-upload",
			path: "user-aaa.png",
		});

		expect(getSignedUploadUrl).toHaveBeenCalledWith("user-aaa.png", { bucket: "avatars" });
		expect(getSignedUploadUrl).not.toHaveBeenCalledWith("user-bbb.png", expect.anything());
	});

	it("does not let a second session mint a key for the first user", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-2", userId: "user-bbb" },
			user: { id: "user-bbb", email: "bbb@example.com", role: "user" },
		} as never);

		const result = await call(createAvatarUploadUrl, {}, { context: { headers: new Headers() } });

		expect(result.path).toBe("user-bbb.png");
		expect(result.path).not.toContain("user-aaa");
		expect(getSignedUploadUrl).toHaveBeenCalledWith("user-bbb.png", { bucket: "avatars" });
	});
});
