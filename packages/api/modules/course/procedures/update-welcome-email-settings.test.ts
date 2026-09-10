import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		course: { findUnique: vi.fn() },
		courseWelcomeEmail: { upsert: vi.fn() },
	},
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { updateWelcomeEmailSettings } from "./update-welcome-email-settings";

describe("updateWelcomeEmailSettings", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "operator-1", email: "operator@example.com", role: "user" },
			session: { id: "session-1", userId: "operator-1" },
		} as never);
		vi.mocked(db.course.findUnique).mockResolvedValue({ id: "course-1" } as never);
		vi.mocked(db.courseWelcomeEmail.upsert).mockImplementation(((args: {
			create: Record<string, unknown>;
			update: Record<string, unknown>;
		}) =>
			Promise.resolve({
				id: "welcome-1",
				courseId: "course-1",
				enabled: true,
				subjectTemplate: "",
				markdownTemplate: "",
				contentJson: null,
				updatedAt: new Date(),
				...args.create,
				...args.update,
			})) as never);
	});

	it("persists contentJson and plain-text export into markdownTemplate", async () => {
		const contentJson = JSON.stringify([
			{
				id: "p1",
				type: "paragraph",
				props: {},
				content: [{ type: "text", text: "你好", styles: {} }],
				children: [],
			},
			{
				id: "cta1",
				type: "ctaButton",
				props: { text: "開始上課", url: "https://startkiter.com/course/abc" },
				children: [],
			},
		]);

		const result = await call(
			updateWelcomeEmailSettings,
			{
				courseId: "course-1",
				enabled: true,
				subjectTemplate: "歡迎 {{userName}}",
				markdownTemplate: "舊 markdown",
				contentJson,
			},
			{ context: { headers: new Headers() } },
		);

		const upsertArg = vi.mocked(db.courseWelcomeEmail.upsert).mock.calls[0]?.[0];
		expect(upsertArg?.create).toEqual(
			expect.objectContaining({
				contentJson,
				markdownTemplate: expect.stringContaining("開始上課"),
			}),
		);
		expect(upsertArg?.update).toEqual(
			expect.objectContaining({
				contentJson,
				markdownTemplate: expect.stringContaining("開始上課"),
			}),
		);
		expect(result.setting).toEqual(expect.objectContaining({ contentJson }));
	});

	it("keeps existing contentJson when request omits it", async () => {
		await call(
			updateWelcomeEmailSettings,
			{
				courseId: "course-1",
				enabled: true,
				subjectTemplate: "只改主旨 {{courseName}}",
				markdownTemplate: "仍是 markdown",
			},
			{ context: { headers: new Headers() } },
		);

		const upsertArg = vi.mocked(db.courseWelcomeEmail.upsert).mock.calls[0]?.[0];
		expect(upsertArg?.update).toEqual({
			enabled: true,
			subjectTemplate: "只改主旨 {{courseName}}",
			markdownTemplate: "仍是 markdown",
		});
		expect(upsertArg?.update).not.toHaveProperty("contentJson");
	});

	it.each([
		["not JSON at all", "not-json{{"],
		["a JSON object without blocks", JSON.stringify({ hello: "world" })],
		["a JSON string", JSON.stringify("paragraph")],
		["an array of empty objects", JSON.stringify([{}])],
		["an array with null", JSON.stringify([null])],
	])("rejects malformed contentJson (%s) before touching the database", async (_label, contentJson) => {
		await expect(
			call(
				updateWelcomeEmailSettings,
				{
					courseId: "course-1",
					enabled: true,
					subjectTemplate: "歡迎",
					markdownTemplate: "markdown",
					contentJson,
				},
				{ context: { headers: new Headers() } },
			),
		).rejects.toThrow(/contentJson|Input validation failed/);

		expect(vi.mocked(db.courseWelcomeEmail.upsert)).not.toHaveBeenCalled();
	});

	it("accepts a blocks wrapper object and persists it", async () => {
		const contentJson = JSON.stringify({
			blocks: [
				{
					id: "p1",
					type: "paragraph",
					props: {},
					content: [{ type: "text", text: "wrapped", styles: {} }],
					children: [],
				},
			],
		});

		const result = await call(
			updateWelcomeEmailSettings,
			{
				courseId: "course-1",
				enabled: true,
				subjectTemplate: "歡迎",
				markdownTemplate: "markdown",
				contentJson,
			},
			{ context: { headers: new Headers() } },
		);

		expect(result.setting).toEqual(expect.objectContaining({ contentJson }));
	});
});
