import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		page: {
			findMany: vi.fn(),
			create: vi.fn(),
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { GET, POST } from "./route";

const OPERATOR_EMAIL = "operator@example.com";

function jsonPost(body: unknown) {
	return new Request("http://localhost/api/pages-cms", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("GET/POST /api/pages-cms", () => {
	const originalAdminEmail = process.env.ADMIN_EMAIL;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = OPERATOR_EMAIL;
	});

	afterEach(() => {
		process.env.ADMIN_EMAIL = originalAdminEmail;
	});

	it("returns 401 when there is no session", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

		const response = await GET(new Request("http://localhost/api/pages-cms"));

		expect(response.status).toBe(401);
		expect(db.page.findMany).not.toHaveBeenCalled();
	});

	it("returns 403 when a non-operator writes", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
		} as never);

		const response = await POST(jsonPost({ type: "PAGE", slug: "about", locale: "zh-tw", title: "關於", body: "" }));

		expect(response.status).toBe(403);
		expect(db.page.create).not.toHaveBeenCalled();
	});
});
