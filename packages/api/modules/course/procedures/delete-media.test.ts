import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mediaFindUnique = vi.hoisted(() => vi.fn());
const mediaDelete = vi.hoisted(() => vi.fn());

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: { media: { findUnique: mediaFindUnique, delete: mediaDelete } },
}));

import { auth } from "@startkiter/auth";

import { deleteMedia } from "./delete-media";

const operatorSession = {
	session: { id: "session-1", userId: "operator-1" },
	user: { id: "operator-1", email: "operator@example.com", role: "user" },
};

describe("deleteMedia", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue(operatorSession as never);
		mediaDelete.mockResolvedValue({ id: "media-1" });
	});

	it("rejects deleting media that is still in use", async () => {
		mediaFindUnique.mockResolvedValue({ id: "media-1", usageId: "lesson-1" });

		await expect(call(deleteMedia, { id: "media-1" }, { context: { headers: new Headers() } }))
			.rejects.toMatchObject({ code: "BAD_REQUEST", data: { error: "IN_USE" } });
		expect(mediaDelete).not.toHaveBeenCalled();
	});

	it("deletes media with no usage reference", async () => {
		mediaFindUnique.mockResolvedValue({ id: "media-1", usageId: null });

		await expect(call(deleteMedia, { id: "media-1" }, { context: { headers: new Headers() } }))
			.resolves.toMatchObject({ deleted: true });
		expect(mediaDelete).toHaveBeenCalledWith({ where: { id: "media-1" } });
	});
});
