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
			findMany: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { GET } from "./route";

describe("GET /api/mcp/connections", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.DATABASE_URL = "postgresql://mock@localhost/startkiter";
		process.env.BETTER_AUTH_SECRET = "test-secret-32-chars-long-value";
		process.env.NEXT_PUBLIC_SAAS_URL = "http://localhost:3000";
	});

	it("returns 401 when there is no session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

		const response = await GET(new Request("http://localhost/api/mcp/connections"));

		expect(response.status).toBe(401);
		expect(db.mcpConnection.findMany).not.toHaveBeenCalled();
	});

	it("lists only the signed-in user's non-revoked connections", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user-1" } } as never);
		vi.mocked(db.mcpConnection.findMany).mockResolvedValue([
			{ id: "conn-1", userId: "user-1", clientName: "Claude" },
		] as never);

		const response = await GET(new Request("http://localhost/api/mcp/connections"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([{ id: "conn-1", userId: "user-1", clientName: "Claude" }]);
		expect(db.mcpConnection.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { userId: "user-1", revokedAt: null } }),
		);
	});
});
