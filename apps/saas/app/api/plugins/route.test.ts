import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {},
}));

import { auth } from "@startkiter/auth";
import type { Session } from "@startkiter/auth";

import { GET } from "./route";

const authenticatedSession = {
	session: {
		id: "session-1",
		userId: "user-1",
		token: "token-1",
		expiresAt: new Date(Date.now() + 60_000),
		createdAt: new Date(),
		updatedAt: new Date(),
		ipAddress: null,
		userAgent: null,
		activeOrganizationId: null,
		impersonatedBy: null,
	},
	user: {
		id: "user-1",
		name: "Test User",
		email: "test@example.com",
		emailVerified: true,
		image: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		role: "user",
		banned: null,
		banReason: null,
		banExpires: null,
		onboardingComplete: true,
		locale: null,
		twoFactorEnabled: false,
		lastActiveOrganizationId: null,
	},
} satisfies Session;

function mockSession(present: boolean) {
	vi.mocked(auth.api.getSession).mockResolvedValue(present ? authenticatedSession : null);
}

function getRequest() {
	return new Request("http://localhost:3000/api/plugins", { method: "GET" });
}

describe("GET /api/plugins (platform-marketplace: Plugin listing API)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("15.1 API returns the course Plugin entry", () => {
		it("returns 200 with a JSON array containing id: course and enabled: true", async () => {
			mockSession(true);

			const response = await GET(getRequest());

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(Array.isArray(body)).toBe(true);
			const course = body.find((plugin: { id: string }) => plugin.id === "course");
			expect(course).toBeDefined();
			expect(course.enabled).toBe(true);
			expect(course).toMatchObject({
				id: "course",
				name: expect.any(String),
				version: expect.any(String),
				enabled: true,
			});
		});
	});

	describe("15.2 Unauthenticated request is denied", () => {
		it("returns 401 and does not return the manifest array", async () => {
			mockSession(false);

			const response = await GET(getRequest());

			expect(response.status).toBe(401);
			const body = await response.json();
			expect(Array.isArray(body)).toBe(false);
		});
	});
});
