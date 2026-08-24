import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		course: { findUnique: vi.fn() },
		courseInvite: { create: vi.fn() },
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { createCourseInvite } from "./create-course-invite";

describe("createCourseInvite", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "operator-1", email: "operator@example.com", role: "user" },
			session: { id: "session-1", userId: "operator-1" },
		} as never);
		vi.mocked(db.course.findUnique).mockResolvedValue({ id: "course-1" } as never);
		vi.mocked(db.courseInvite.create).mockImplementation((async ({ data }: { data: Record<string, unknown> }) => ({
			id: "invite-1",
			...data,
		})) as never);
	});

	it("returns plaintext once while persisting only its SHA-256 hash", async () => {
		const result = await call(
			createCourseInvite,
			{ courseId: "course-1", maxUses: 1, email: "Learner@Example.com", expiresAt: null },
			{ context: { headers: new Headers() } },
		);

		expect(result.token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
		expect(result.inviteUrl).toContain(`/invite/${result.token}`);
		const persisted = vi.mocked(db.courseInvite.create).mock.calls[0]?.[0]?.data as Record<string, unknown>;
		expect(persisted.tokenHash).toMatch(/^[a-f0-9]{64}$/);
		expect(persisted.tokenHash).not.toBe(result.token);
		expect(persisted).not.toHaveProperty("token");
	});
});
