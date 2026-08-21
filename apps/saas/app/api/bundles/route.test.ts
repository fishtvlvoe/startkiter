import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/bundles", () => ({
	listPublishedBundles: vi.fn(),
	createBundle: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { createBundle, listPublishedBundles } from "@startkiter/bundles";

import { GET, POST } from "./route";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedListPublishedBundles = vi.mocked(listPublishedBundles);
const mockedCreateBundle = vi.mocked(createBundle);

const OPERATOR_EMAIL = "operator@example.com";

function jsonRequest(body: unknown) {
	return new Request("http://localhost/api/bundles", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

const publishedBundle = {
	id: "bundle_1",
	slug: "combo-a",
	title: "組合包 A",
	description: null,
	priceTwd: 5000,
	status: "published" as const,
	courseIds: ["course_1", "course_2"],
};

describe("GET /api/bundles (Requirement: Bundle listing API returns published bundles only)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 200 with only published bundles for an unauthenticated request", async () => {
		mockedListPublishedBundles.mockResolvedValue([publishedBundle]);

		const response = await GET();

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.bundles).toEqual([publishedBundle]);
		// GET 沒有呼叫 auth.getSession，證明未登入也能存取。
		expect(mockedGetSession).not.toHaveBeenCalled();
	});
});

describe("POST /api/bundles (operator-only bundle creation)", () => {
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

		const response = await POST(jsonRequest({}));

		expect(response.status).toBe(401);
		expect(mockedCreateBundle).not.toHaveBeenCalled();
	});

	it("returns 403 when the session user is not the configured operator", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
		} as never);

		const response = await POST(jsonRequest({}));

		expect(response.status).toBe(403);
		expect(mockedCreateBundle).not.toHaveBeenCalled();
	});

	it("creates a published bundle for a valid operator request (Scenario: Operator creates a published bundle)", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "operator_1", email: OPERATOR_EMAIL },
		} as never);
		mockedCreateBundle.mockResolvedValue({ ok: true, bundle: publishedBundle });

		const response = await POST(
			jsonRequest({
				slug: "combo-a",
				title: "組合包 A",
				priceTwd: 5000,
				status: "published",
				courseIds: ["course_1", "course_2"],
			}),
		);

		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.bundle).toEqual(publishedBundle);
	});

	it("returns 400 without creating anything when courseIds contains a nonexistent course id", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "operator_1", email: OPERATOR_EMAIL },
		} as never);
		mockedCreateBundle.mockResolvedValue({
			ok: false,
			reason: "course_not_found",
			missingCourseIds: ["missing_course"],
		});

		const response = await POST(
			jsonRequest({
				slug: "combo-bad",
				title: "含不存在課程",
				priceTwd: 3000,
				status: "published",
				courseIds: ["missing_course"],
			}),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe("course_not_found");
	});

	it("returns 400 for a malformed body without calling createBundle", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "operator_1", email: OPERATOR_EMAIL },
		} as never);

		const response = await POST(jsonRequest({ title: "缺 slug" }));

		expect(response.status).toBe(400);
		expect(mockedCreateBundle).not.toHaveBeenCalled();
	});
});
