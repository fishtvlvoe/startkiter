import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		mcpConnection: {
			create: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
		},
		order: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		lessonProgress: {
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import type { Session } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { GET as connectionsGet } from "./connections/route";
import { DELETE as connectionDelete } from "./connections/[id]/route";
import { GET as mcpGet, POST as mcpPost } from "./route";

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

function jsonRequest(body: unknown, headers?: HeadersInit) {
	return new Request("http://localhost:3000/api/mcp", {
		method: "POST",
		headers: { "content-type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
}

async function readJson(response: Response) {
	return response.json();
}

describe("MCP Gateway", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.DATABASE_URL = "postgresql://mock@localhost/startkiter";
		process.env.BETTER_AUTH_SECRET = "test-secret-32-chars-long-value";
		process.env.NEXT_PUBLIC_SAAS_URL = "http://localhost:3000";
	});

	describe("24.1 handshake with valid session", () => {
		it("returns serverInfo and capabilities", async () => {
			mockSession(true);
			vi.mocked(db.mcpConnection.create).mockResolvedValue({
				id: "conn-1",
				userId: "user-1",
				clientName: "Claude",
				authorizedAt: new Date(),
				lastUsedAt: null,
				revokedAt: null,
			});

			const response = await mcpPost(
				jsonRequest({
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
					params: { clientInfo: { name: "Claude", version: "1.0" } },
				}),
			);

			expect(response.status).toBe(200);
			const body = await readJson(response);
			expect(body.jsonrpc).toBe("2.0");
			expect(body.result.serverInfo).toEqual({ name: "StartKiter MCP Gateway", version: "1.0.0" });
			expect(body.result.capabilities).toEqual({ tools: {} });
			expect(body.result.protocolVersion).toBe("2024-11-05");
		});

		it("creates a connection record on initialize", async () => {
			mockSession(true);
			vi.mocked(db.mcpConnection.create).mockResolvedValue({
				id: "conn-1",
				userId: "user-1",
				clientName: "Claude",
				authorizedAt: new Date(),
				lastUsedAt: null,
				revokedAt: null,
			});

			await mcpPost(
				jsonRequest({
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
					params: { clientInfo: { name: "Claude", version: "1.0" } },
				}),
			);

			expect(db.mcpConnection.create).toHaveBeenCalledTimes(1);
			const created = vi.mocked(db.mcpConnection.create).mock.calls[0][0].data;
			expect(created.userId).toBe("user-1");
			expect(created.clientName).toBe("Claude");
			expect(created.authorizedAt).toBeInstanceOf(Date);
		});
	});

	describe("24.2 handshake without session", () => {
		it("directs the client to the login flow and does not establish a session", async () => {
			mockSession(false);

			const response = await mcpPost(
				jsonRequest({
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
					params: { clientInfo: { name: "Claude", version: "1.0" } },
				}),
			);

			expect(response.status).toBe(401);
			const body = await readJson(response);
			expect(body.error).toBe("authentication_required");
			expect(body.loginUrl).toContain("/login");
			expect(db.mcpConnection.create).not.toHaveBeenCalled();
		});
	});

	describe("24.3 OAuth-style session flow does not surface an API key", () => {
		it("returns no apiKey field in the authorization response", async () => {
			mockSession(true);
			vi.mocked(db.mcpConnection.create).mockResolvedValue({
				id: "conn-1",
				userId: "user-1",
				clientName: "Claude",
				authorizedAt: new Date(),
				lastUsedAt: null,
				revokedAt: null,
			});

			const response = await mcpPost(
				jsonRequest({
					jsonrpc: "2.0",
					id: 1,
					method: "initialize",
					params: { clientInfo: { name: "Claude", version: "1.0" } },
				}),
			);

			const body = await readJson(response);
			expect(JSON.stringify(body)).not.toContain("apiKey");
			expect(JSON.stringify(body)).not.toContain("api_key");
		});
	});

	describe("24.4 connection management", () => {
		it("lists only the signed-in user's non-revoked connections", async () => {
			mockSession(true);
			vi.mocked(db.mcpConnection.findMany).mockResolvedValue([
				{
					id: "conn-1",
					userId: "user-1",
					clientName: "Claude",
					authorizedAt: new Date(),
					lastUsedAt: null,
					revokedAt: null,
				},
			]);

			const response = await connectionsGet(new Request("http://localhost:3000/api/mcp/connections"));
			expect(response.status).toBe(200);
			const body = await readJson(response);
			expect(body).toHaveLength(1);
			expect(body[0].id).toBe("conn-1");
			expect(db.mcpConnection.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { userId: "user-1", revokedAt: null } }),
			);
		});

		it("revokes the user's own connection", async () => {
			mockSession(true);
			vi.mocked(db.mcpConnection.findFirst).mockResolvedValue({
				id: "conn-1",
				userId: "user-1",
				clientName: "Claude",
				authorizedAt: new Date(),
				lastUsedAt: null,
				revokedAt: null,
			});

			const response = await connectionDelete(
				new Request("http://localhost:3000/api/mcp/connections/conn-1"),
				{ params: Promise.resolve({ id: "conn-1" }) },
			);

			expect(response.status).toBe(200);
			expect(db.mcpConnection.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: "conn-1" },
					data: expect.objectContaining({ revokedAt: expect.any(Date) }),
				}),
			);
		});

		it("cannot revoke another user's connection", async () => {
			mockSession(true);
			vi.mocked(db.mcpConnection.findFirst).mockResolvedValue(null);

			const response = await connectionDelete(
				new Request("http://localhost:3000/api/mcp/connections/conn-other"),
				{ params: Promise.resolve({ id: "conn-other" }) },
			);

			expect(response.status).toBe(404);
			expect(db.mcpConnection.update).not.toHaveBeenCalled();
		});
	});

	describe("24.5 read-only tool surface", () => {
		it("lists only the two read-only tools", async () => {
			mockSession(true);

			const response = await mcpPost(
				jsonRequest({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
			);

			const body = await readJson(response);
			expect(body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
				"get_my_orders",
				"get_my_course_progress",
			]);
		});

		it("calls get_my_orders without mutating data", async () => {
			mockSession(true);
			vi.mocked(db.order.findMany).mockResolvedValue([
				{ id: "order-1", userId: "user-1", orderNo: "SK-001" },
			] as unknown as Awaited<ReturnType<typeof db.order.findMany>>);
			vi.mocked(db.mcpConnection.updateMany).mockResolvedValue({ count: 1 });

			const response = await mcpPost(
				jsonRequest({
					jsonrpc: "2.0",
					id: 3,
					method: "tools/call",
					params: { name: "get_my_orders", arguments: {} },
				}),
			);

			expect(response.status).toBe(200);
			const body = await readJson(response);
			expect(body.result.isError).toBe(false);
			expect(db.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-1" } }));
			expect(db.order.create).not.toHaveBeenCalled();
			expect(db.order.update).not.toHaveBeenCalled();
			expect(db.order.delete).not.toHaveBeenCalled();
		});

		it("rejects a write-style tool and does not mutate data", async () => {
			mockSession(true);
			vi.mocked(db.mcpConnection.updateMany).mockResolvedValue({ count: 0 });

			const response = await mcpPost(
				jsonRequest({
					jsonrpc: "2.0",
					id: 4,
					method: "tools/call",
					params: { name: "create_order", arguments: { amount: 100 } },
				}),
			);

			const body = await readJson(response);
			expect(body.error).toBeDefined();
			expect(db.order.create).not.toHaveBeenCalled();
			expect(db.order.update).not.toHaveBeenCalled();
			expect(db.order.delete).not.toHaveBeenCalled();
		});
	});

	describe("24.6 fail-closed when auth configuration is missing", () => {
		it("returns 503 when BETTER_AUTH_SECRET is missing", async () => {
			mockSession(true);
			delete process.env.BETTER_AUTH_SECRET;

			const response = await mcpPost(
				jsonRequest({ jsonrpc: "2.0", id: 1, method: "initialize" }),
			);

			expect(response.status).toBe(503);
			expect(await readJson(response)).toMatchObject({ error: "service_unavailable" });
		});

		it("returns 503 when DATABASE_URL is missing", async () => {
			mockSession(true);
			delete process.env.DATABASE_URL;

			const response = await mcpGet(new Request("http://localhost:3000/api/mcp"));

			expect(response.status).toBe(503);
		});
	});
});
