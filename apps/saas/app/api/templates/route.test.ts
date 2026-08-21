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
	return new Request("http://localhost:3000/api/templates", { method: "GET" });
}

describe("GET /api/templates (buyer-template-selection: Template listing API)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("17.3 API returns built-in templates", () => {
		it("returns 200 with >= 2 template objects including id name description previewImagePath", async () => {
			mockSession(true);

			const response = await GET(getRequest());

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(Array.isArray(body)).toBe(true);
			expect(body.length).toBeGreaterThanOrEqual(2);
			for (const template of body) {
				expect(template).toMatchObject({
					id: expect.any(String),
					name: expect.any(String),
					description: expect.any(String),
					previewImagePath: expect.any(String),
				});
			}
			expect(body.some((template: { id: string }) => template.id === "course-site")).toBe(
				true,
			);
		});
	});

	describe("17.4 Unauthenticated request is denied", () => {
		it("returns 401 without a valid session", async () => {
			mockSession(false);

			const response = await GET(getRequest());

			expect(response.status).toBe(401);
			const body = await response.json();
			expect(Array.isArray(body)).toBe(false);
		});
	});
});
