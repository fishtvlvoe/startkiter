import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/bundles", () => ({
	deleteBundle: vi.fn(),
	updateBundle: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { deleteBundle, updateBundle } from "@startkiter/bundles";

import { DELETE, PUT } from "./route";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedUpdateBundle = vi.mocked(updateBundle);
const mockedDeleteBundle = vi.mocked(deleteBundle);

const OPERATOR_EMAIL = "operator@example.com";
const params = { params: Promise.resolve({ id: "bundle_1" }) };

function jsonPut(body: unknown) {
	return new Request("http://localhost/api/bundles/bundle_1", {
		method: "PUT",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

const validBody = {
	slug: "combo-a",
	title: "組合包 A",
	priceTwd: 5000,
	status: "published",
	courseIds: ["course_1"],
};

describe("PUT/DELETE /api/bundles/:id (operator-only; no public GET)", () => {
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

		const response = await PUT(jsonPut(validBody), params);

		expect(response.status).toBe(401);
		expect(mockedUpdateBundle).not.toHaveBeenCalled();
	});

	it("returns 403 when the session user is not the configured operator", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
		} as never);

		const response = await PUT(jsonPut(validBody), params);

		expect(response.status).toBe(403);
		expect(mockedUpdateBundle).not.toHaveBeenCalled();
	});

	it("returns 404 when the bundle id does not exist", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "operator_1", email: OPERATOR_EMAIL },
		} as never);
		mockedUpdateBundle.mockResolvedValue({ ok: false, reason: "not_found" });

		const response = await PUT(jsonPut(validBody), params);

		expect(response.status).toBe(404);
	});

	it("returns 401/403/404 on DELETE with the same operator gate", async () => {
		mockedGetSession.mockResolvedValue(null as never);
		expect((await DELETE(new Request("http://localhost/api/bundles/bundle_1"), params)).status).toBe(401);

		mockedGetSession.mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
		} as never);
		expect((await DELETE(new Request("http://localhost/api/bundles/bundle_1"), params)).status).toBe(403);
		expect(mockedDeleteBundle).not.toHaveBeenCalled();

		mockedGetSession.mockResolvedValue({
			user: { id: "operator_1", email: OPERATOR_EMAIL },
		} as never);
		mockedDeleteBundle.mockResolvedValue({ ok: false, reason: "not_found" });

		expect((await DELETE(new Request("http://localhost/api/bundles/missing"), params)).status).toBe(404);
	});
});
