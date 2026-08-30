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
			findFirst: vi.fn(),
			update: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { DELETE } from "./route";

const params = { params: Promise.resolve({ id: "conn-other" }) };

describe("DELETE /api/mcp/connections/:id", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.DATABASE_URL = "postgresql://mock@localhost/startkiter";
		process.env.BETTER_AUTH_SECRET = "test-secret-32-chars-long-value";
		process.env.NEXT_PUBLIC_SAAS_URL = "http://localhost:3000";
	});

	it("returns 401 when there is no session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

		const response = await DELETE(new Request("http://localhost/api/mcp/connections/conn-other"), params);

		expect(response.status).toBe(401);
		expect(db.mcpConnection.findFirst).not.toHaveBeenCalled();
		expect(db.mcpConnection.update).not.toHaveBeenCalled();
	});

	it("returns 404 when the connection id does not belong to the signed-in user", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: "user-1" } } as never);
		vi.mocked(db.mcpConnection.findFirst).mockResolvedValue(null);

		const response = await DELETE(new Request("http://localhost/api/mcp/connections/conn-other"), params);

		expect(response.status).toBe(404);
		expect(db.mcpConnection.findFirst).toHaveBeenCalledWith({
			where: { id: "conn-other", userId: "user-1", revokedAt: null },
		});
		expect(db.mcpConnection.update).not.toHaveBeenCalled();
	});
});
