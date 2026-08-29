import { beforeEach, describe, expect, it } from "vitest";

import { buildLessonToolEmbedPath } from "./embed-path";
import { verifyLessonToolToken } from "./token";

const publicLookup = async () => ["93.184.216.34"];

describe("buildLessonToolEmbedPath (Requirement: Re-check happens at token issuance time, not only at save time)", () => {
	beforeEach(() => {
		process.env.BETTER_AUTH_SECRET = "test-lesson-tool-secret";
	});

	it("refuses to issue a token when the current tool URL is private", async () => {
		await expect(
			buildLessonToolEmbedPath({
				lessonId: "lesson-1",
				userId: "user-1",
				toolUrl: "http://10.1.2.3/internal",
			}),
		).resolves.toBeNull();
	});

	it("refuses to issue a token when DNS currently resolves to a private address", async () => {
		await expect(
			buildLessonToolEmbedPath({
				lessonId: "lesson-1",
				userId: "user-1",
				toolUrl: "https://tools.example.com/whiteboard",
				lookup: async () => ["10.0.0.1"],
			}),
		).resolves.toBeNull();
	});

	it("issues a signed path for a public tool URL", async () => {
		const issued = await buildLessonToolEmbedPath({
			lessonId: "lesson-1",
			userId: "user-1",
			toolUrl: "https://tools.example.com/whiteboard",
			lookup: publicLookup,
		});

		expect(issued).not.toBeNull();
		expect(issued?.path).toContain("/lesson-tool/lesson-1/");
		expect(issued?.path).toContain("token=");
		expect(verifyLessonToolToken(issued!.token, "lesson-1", "user-1")).toBe(true);
	});
});
