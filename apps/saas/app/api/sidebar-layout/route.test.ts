import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

const dbMock = vi.hoisted(() => {
	const mock = {
		sidebarGroup: {
			findMany: vi.fn(),
			create: vi.fn(),
			createMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		sidebarGroupItem: {
			findMany: vi.fn(),
			createMany: vi.fn(),
			deleteMany: vi.fn(),
		},
		$transaction: vi.fn(),
	};
	mock.$transaction.mockImplementation(async (fn: (tx: typeof mock) => unknown) => fn(mock));
	return mock;
});

vi.mock("@startkiter/database", () => ({
	db: dbMock,
}));

import { auth } from "@startkiter/auth";
import type { Session } from "@startkiter/auth";

import { GET, PUT } from "./route";

const operatorEmail = "admin@startkiter.local";

function sessionFor(email: string): Session {
	return {
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
			email,
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
}

function mockSession(session: Session | null) {
	vi.mocked(auth.api.getSession).mockResolvedValue(session);
}

function getRequest() {
	return new Request("http://localhost:3000/api/sidebar-layout", { method: "GET" });
}

function putRequest(body: unknown) {
	return new Request("http://localhost:3000/api/sidebar-layout", {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

describe("GET/PUT /api/sidebar-layout (task 43: 側邊欄分組持久化 API)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = operatorEmail;
		dbMock.sidebarGroup.findMany.mockResolvedValue([]);
		dbMock.sidebarGroupItem.findMany.mockResolvedValue([]);
	});

	describe("43.1 GET returns groups/items, 401 when unauthenticated", () => {
		it("returns { groups, items } for a signed-in user", async () => {
			mockSession(sessionFor("learner@example.com"));
			dbMock.sidebarGroup.findMany.mockResolvedValue([
				{ id: "g1", title: "主要", order: 0, isCollapsed: false },
			]);
			dbMock.sidebarGroupItem.findMany.mockResolvedValue([
				{ id: "i1", groupId: "g1", menuItemId: "start", order: 0 },
			]);

			const response = await GET(getRequest());

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body).toEqual({
				groups: [{ id: "g1", title: "主要", order: 0, isCollapsed: false }],
				items: [{ id: "i1", groupId: "g1", menuItemId: "start", order: 0 }],
			});
		});

		it("returns 401 without a valid session", async () => {
			mockSession(null);

			const response = await GET(getRequest());

			expect(response.status).toBe(401);
		});
	});

	describe("43.2 PUT requires operator", () => {
		it("operator can write groups and items", async () => {
			mockSession(sessionFor(operatorEmail));

			const response = await PUT(
				putRequest({
					groups: [{ id: "g1", title: "主要", order: 0, isCollapsed: false }],
					items: [{ id: "i1", groupId: "g1", menuItemId: "start", order: 0 }],
				}),
			);

			expect(response.status).toBe(200);
			expect(dbMock.$transaction).toHaveBeenCalled();
		});

		it("non-operator PUT is rejected with 403", async () => {
			mockSession(sessionFor("learner@example.com"));

			const response = await PUT(
				putRequest({
					groups: [{ id: "g1", title: "主要", order: 0, isCollapsed: false }],
					items: [],
				}),
			);

			expect(response.status).toBe(403);
			expect(dbMock.$transaction).not.toHaveBeenCalled();
		});
	});

	describe("43.3 PUT rejects unknown menuItemId without blocking valid items", () => {
		it("returns 400 detailing the rejected item, valid items still persisted", async () => {
			mockSession(sessionFor(operatorEmail));

			const response = await PUT(
				putRequest({
					groups: [{ id: "g1", title: "主要", order: 0, isCollapsed: false }],
					items: [
						{ id: "i1", groupId: "g1", menuItemId: "start", order: 0 },
						{ id: "i2", groupId: "g1", menuItemId: "does-not-exist", order: 1 },
					],
				}),
			);

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.rejected).toEqual(["does-not-exist"]);
			expect(dbMock.$transaction).toHaveBeenCalled();
			const createManyCall = dbMock.sidebarGroupItem.createMany.mock.calls[0]?.[0];
			expect(createManyCall.data).toEqual([
				{ id: "i1", groupId: "g1", menuItemId: "start", order: 0 },
			]);
		});
	});

	describe("43.4 SidebarGroup empty returns empty arrays", () => {
		it("returns empty groups/items when nothing initialized yet", async () => {
			mockSession(sessionFor("learner@example.com"));
			dbMock.sidebarGroup.findMany.mockResolvedValue([]);
			dbMock.sidebarGroupItem.findMany.mockResolvedValue([]);

			const response = await GET(getRequest());

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body).toEqual({ groups: [], items: [] });
		});
	});
});
