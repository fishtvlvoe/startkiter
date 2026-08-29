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
			create: vi.fn(),
			update: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
		},
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { DELETE, PATCH, POST, restorePOST } from "./handlers";

const mockedGetSession = vi.mocked(auth.api.getSession);
const mockedCreate = vi.mocked(db.page.create);
const mockedUpdate = vi.mocked(db.page.update);
const mockedFindUnique = vi.mocked(db.page.findUnique);
const mockedFindFirst = vi.mocked(db.page.findFirst);

const OPERATOR_EMAIL = "operator@example.com";
const originalAdminEmail = process.env.ADMIN_EMAIL;

function jsonRequest(url: string, method: string, body?: unknown) {
	return new Request(url, {
		method,
		headers: { "content-type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

function draftPage(overrides: Record<string, unknown> = {}) {
	return {
		id: "page_1",
		type: "POST",
		slug: "hello",
		locale: "zh-tw",
		title: "草稿標題",
		excerpt: null,
		body: "<p>內容</p>",
		coverImageUrl: null,
		seoTitle: null,
		seoDescription: null,
		tags: [],
		status: "DRAFT",
		publishedAt: null,
		previousSnapshot: null,
		createdAt: new Date("2026-08-29T00:00:00.000Z"),
		updatedAt: new Date("2026-08-29T00:00:00.000Z"),
		...overrides,
	};
}

describe("Pages CMS HTTP API (Requirement: Buyer can create and edit page or post content)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = OPERATOR_EMAIL;
		mockedFindFirst.mockResolvedValue(null);
	});

	afterEach(() => {
		process.env.ADMIN_EMAIL = originalAdminEmail;
	});

	it("creates a POST as DRAFT and does not set publishedAt", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: OPERATOR_EMAIL },
		} as never);
		mockedCreate.mockResolvedValue(draftPage() as never);

		const response = await POST(
			jsonRequest("http://localhost/api/pages-cms", "POST", {
				type: "POST",
				title: "草稿標題",
				slug: "hello",
				body: "<p>內容</p>",
				locale: "zh-tw",
			}),
		);

		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.page.status).toBe("DRAFT");
		expect(body.page.publishedAt).toBeNull();
		expect(Array.isArray(body.warnings)).toBe(true);
		expect(mockedCreate).toHaveBeenCalled();
		expect(mockedCreate.mock.calls[0]?.[0]?.data.status).toBe("DRAFT");
	});

	it("sets publishedAt when a draft is published", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: OPERATOR_EMAIL },
		} as never);
		mockedFindUnique.mockResolvedValue(draftPage() as never);
		mockedUpdate.mockResolvedValue(
			draftPage({
				status: "PUBLISHED",
				publishedAt: new Date("2026-08-29T12:00:00.000Z"),
			}) as never,
		);

		const response = await PATCH(
			jsonRequest("http://localhost/api/pages-cms/page_1", "PATCH", {
				status: "PUBLISHED",
			}),
			{ params: Promise.resolve({ id: "page_1" }) },
		);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.page.status).toBe("PUBLISHED");
		expect(body.page.publishedAt).toBeTruthy();
		expect(mockedUpdate.mock.calls[0]?.[0]?.data.publishedAt).toBeInstanceOf(Date);
	});

	it("returns 401 when the caller has no session", async () => {
		mockedGetSession.mockResolvedValue(null as never);

		const response = await POST(
			jsonRequest("http://localhost/api/pages-cms", "POST", {
				type: "POST",
				title: "草稿標題",
				slug: "hello",
				body: "<p>內容</p>",
				locale: "zh-tw",
			}),
		);

		expect(response.status).toBe(401);
		expect(mockedCreate).not.toHaveBeenCalled();
	});

	it("returns 403 when the caller is authenticated but not the operator", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
		} as never);

		const response = await DELETE(
			jsonRequest("http://localhost/api/pages-cms/page_1", "DELETE"),
			{ params: Promise.resolve({ id: "page_1" }) },
		);

		expect(response.status).toBe(403);
		expect(mockedUpdate).not.toHaveBeenCalled();
	});

	it("returns 403 for restore when the caller is not the operator", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
		} as never);

		const response = await restorePOST(
			jsonRequest("http://localhost/api/pages-cms/page_1/restore", "POST"),
			{ params: Promise.resolve({ id: "page_1" }) },
		);

		expect(response.status).toBe(403);
		expect(mockedUpdate).not.toHaveBeenCalled();
	});

	it("returns 403 for a role=admin user whose email is not ADMIN_EMAIL", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "admin_1", email: "role-admin@example.com", role: "admin" },
		} as never);

		const response = await POST(
			jsonRequest("http://localhost/api/pages-cms", "POST", {
				type: "POST",
				title: "草稿標題",
				slug: "hello",
				body: "<p>內容</p>",
				locale: "zh-tw",
			}),
		);

		expect(response.status).toBe(403);
		expect(mockedCreate).not.toHaveBeenCalled();
	});

	it("allows ADMIN_EMAIL even when role is not admin", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: OPERATOR_EMAIL, role: "user" },
		} as never);
		mockedCreate.mockResolvedValue(draftPage() as never);

		const response = await POST(
			jsonRequest("http://localhost/api/pages-cms", "POST", {
				type: "POST",
				title: "草稿標題",
				slug: "hello",
				body: "<p>內容</p>",
				locale: "zh-tw",
			}),
		);

		expect(response.status).toBe(201);
		expect(mockedCreate).toHaveBeenCalled();
	});
});
