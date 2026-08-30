import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/bundles", () => ({
	listAllBundles: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		course: {
			findMany: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { listAllBundles } from "@startkiter/bundles";
import { db } from "@startkiter/database";

import { GET } from "./route";

const mockedGetSession = vi.mocked(auth.api.getSession);
const OPERATOR_EMAIL = "operator@example.com";

describe("GET /api/bundles/admin", () => {
	const originalAdminEmail = process.env.ADMIN_EMAIL;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = OPERATOR_EMAIL;
	});

	afterEach(() => {
		process.env.ADMIN_EMAIL = originalAdminEmail;
	});

	it("returns 401 when there is no session", async () => {
		mockedGetSession.mockResolvedValue(null as never);

		const response = await GET(new Request("http://localhost/api/bundles/admin"));

		expect(response.status).toBe(401);
		expect(listAllBundles).not.toHaveBeenCalled();
		expect(db.course.findMany).not.toHaveBeenCalled();
	});

	it("returns 403 when the session user is not the configured operator", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
		} as never);

		const response = await GET(new Request("http://localhost/api/bundles/admin"));

		expect(response.status).toBe(403);
		expect(listAllBundles).not.toHaveBeenCalled();
	});
});
