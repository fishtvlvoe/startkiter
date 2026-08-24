import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mediaCreate = vi.hoisted(() => vi.fn());

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: { media: { create: mediaCreate }, course: { update: vi.fn() } },
}));

vi.mock("../lib/video-resolver", () => ({
	resolveVideoSource: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { resolveVideoSource } from "../lib/video-resolver";

import { registerMedia } from "./register-media";

const operatorSession = {
	session: { id: "session-1", userId: "operator-1" },
	user: { id: "operator-1", email: "operator@example.com", role: "user" },
};

describe("registerMedia", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue(operatorSession as never);
		mediaCreate.mockResolvedValue({ id: "media-1", type: "VIDEO" });
	});

	it("registers a valid Bunny video using the existing resolver", async () => {
		vi.mocked(resolveVideoSource).mockReturnValue({
			ok: true,
			provider: "BUNNY",
			sourceId: "xyz789",
			url: "https://vz-abc123.b-cdn.net/play/xyz789",
		});

		await expect(call(registerMedia, {
			type: "VIDEO",
			url: "https://vz-abc123.b-cdn.net/play/xyz789",
		}, { context: { headers: new Headers() } })).resolves.toMatchObject({ id: "media-1" });

		expect(resolveVideoSource).toHaveBeenCalledWith("https://vz-abc123.b-cdn.net/play/xyz789");
		expect(mediaCreate).toHaveBeenCalledWith(expect.objectContaining({
		data: expect.objectContaining({ type: "VIDEO", provider: "BUNNY", sourceId: "xyz789" }),
	}));
	});

	it("rejects an unresolvable video without creating a record", async () => {
		vi.mocked(resolveVideoSource).mockReturnValue({ ok: false, error: "Unsupported video host." });

		await expect(call(registerMedia, {
			type: "VIDEO",
			url: "https://example.com/not-a-video",
		}, { context: { headers: new Headers() } })).rejects.toMatchObject({ code: "BAD_REQUEST" });

		expect(mediaCreate).not.toHaveBeenCalled();
	});

	it("registers an uploaded image with its display metadata", async () => {
		mediaCreate.mockResolvedValue({ id: "media-image-1", type: "IMAGE", filename: "cover.png" });

		await expect(call(registerMedia, {
			type: "IMAGE",
			path: "media/operator-1/cover-1.png",
			filename: "cover.png",
			mimeType: "image/png",
			size: 2048,
		}, { context: { headers: new Headers() } })).resolves.toMatchObject({ id: "media-image-1" });

		expect(mediaCreate).toHaveBeenCalledWith(expect.objectContaining({
		data: expect.objectContaining({ type: "IMAGE", url: "media/operator-1/cover-1.png", filename: "cover.png", mimeType: "image/png", size: 2048 }),
		}));
	});
});
