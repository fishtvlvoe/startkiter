import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { hasPassedQuiz, recordQuizAttempt } from "./index";

describe.sequential("Quiz attempts", () => {
	const createdAttemptIds: string[] = [];
	const createdUserIds: string[] = [];

	it("records an attempt and queries the learner pass status", async () => {
		const user = await db.user.create({
			data: {
				name: "Quiz learner",
				email: `quiz-learner-${randomUUID()}@example.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		createdUserIds.push(user.id);

		const attempt = await recordQuizAttempt({
			userId: user.id,
			pluginContentId: "quiz-content-1",
			answers: { q1: "b" },
			score: 100,
			passed: true,
			timeTakenSeconds: 12,
		});
		createdAttemptIds.push(attempt.id);

		expect(await hasPassedQuiz(user.id, "quiz-content-1")).toBe(true);
		expect(await hasPassedQuiz(user.id, "quiz-content-missing")).toBe(false);
	});

	afterEach(async () => {
		for (const id of createdAttemptIds.splice(0)) {
			await db.quizAttempt.delete({ where: { id } }).catch(() => undefined);
		}
		for (const id of createdUserIds.splice(0)) {
			await db.user.delete({ where: { id } }).catch(() => undefined);
		}
	});

	afterAll(async () => {
		await db.$disconnect();
	});
});
