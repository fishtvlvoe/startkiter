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
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			update: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { DELETE, PATCH } from "./route";

const OPERATOR_EMAIL = "operator@example.com";
const params = { params: Promise.resolve({ id: "page-missing" }) };

function jsonPatch(body: unknown) {
	return new Request("http://localhost/api/pages-cms/page-missing", {
		method: "PATCH",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("PATCH/DELETE /api/pages-cms/:id", () => {
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

		const response = await PATCH(jsonPatch({ title: "x" }), params);

		expect(response.status).toBe(401);
		expect(db.page.findUnique).not.toHaveBeenCalled();
	});

	it("returns 403 when a non-operator writes", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
		} as never);

		const response = await DELETE(new Request("http://localhost/api/pages-cms/page-missing"), params);

		expect(response.status).toBe(403);
		expect(db.page.update).not.toHaveBeenCalled();
	});

	it("returns 404 when the page does not exist", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "operator_1", email: OPERATOR_EMAIL },
		} as never);
		vi.mocked(db.page.findUnique).mockResolvedValue(null);

		const response = await PATCH(jsonPatch({ title: "x" }), params);

		expect(response.status).toBe(404);
		expect(db.page.update).not.toHaveBeenCalled();
	});
});
