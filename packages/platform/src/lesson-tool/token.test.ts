import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { signLessonToolToken, verifyLessonToolToken } from "./token";

describe("signLessonToolToken / verifyLessonToolToken (Requirement: Learner accesses the embedded tool through a short-lived signed token)", () => {
	beforeEach(() => {
		process.env.BETTER_AUTH_SECRET = "test-lesson-tool-secret";
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("accepts a token signed for the same lessonId and userId within 2 hours", () => {
		const token = signLessonToolToken("lesson-1", "user-1");

		expect(verifyLessonToolToken(token, "lesson-1", "user-1")).toBe(true);
	});

	it("rejects a token whose payload has been tampered with", () => {
		const token = signLessonToolToken("lesson-1", "user-1");
		const [payload, signature] = token.split(".");
		const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
		parsed.userId = "attacker";
		const tampered = `${Buffer.from(JSON.stringify(parsed), "utf8").toString("base64url")}.${signature}`;

		expect(verifyLessonToolToken(tampered, "lesson-1", "user-1")).toBe(false);
	});

	it("rejects a token when the requested lessonId does not match", () => {
		const token = signLessonToolToken("lesson-1", "user-1");

		expect(verifyLessonToolToken(token, "lesson-other", "user-1")).toBe(false);
	});

	it("rejects a token when the requested userId does not match", () => {
		const token = signLessonToolToken("lesson-1", "user-1");

		expect(verifyLessonToolToken(token, "lesson-1", "user-other")).toBe(false);
	});

	it("rejects a token after the 2-hour TTL has elapsed", () => {
		const token = signLessonToolToken("lesson-1", "user-1");

		vi.setSystemTime(new Date("2026-01-01T02:00:01.000Z"));

		expect(verifyLessonToolToken(token, "lesson-1", "user-1")).toBe(false);
	});
});
