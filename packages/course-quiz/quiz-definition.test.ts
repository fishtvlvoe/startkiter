import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { createQuizDefinition, getQuizDefinition } from "./quiz-definition";

describe.sequential("Quiz definitions use shared PluginContent", () => {
	const createdContentIds: string[] = [];
	const createdUserIds: string[] = [];

	it("creates and retrieves a quiz definition by pluginId and type", async () => {
		const user = await db.user.create({
			data: {
				name: "Quiz test operator",
				email: `quiz-${randomUUID()}@example.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		createdUserIds.push(user.id);

		const created = await createQuizDefinition({
			authorId: user.id,
			title: "第一堂測驗",
			body: {
				lessonId: "lesson-1",
				passingScore: 60,
				timeLimitMinutes: null,
				shuffleQuestions: false,
				shuffleOptions: false,
				showAnswers: "IMMEDIATELY",
				blockNextLesson: false,
				questions: [{
					id: "q1",
					type: "SINGLE_CHOICE",
					content: "1+1=?",
					options: [{ id: "a", text: "2" }, { id: "b", text: "3" }],
					correctAnswer: "a",
					explanation: null,
					points: 1,
				}],
			},
		});
		createdContentIds.push(created.id);

		expect(created.pluginId).toBe("quiz");
		expect(created.type).toBe("quiz-definition");
		expect(await getQuizDefinition(created.id)).toMatchObject({ id: created.id, title: "第一堂測驗" });
	});

	afterEach(async () => {
		for (const id of createdContentIds.splice(0)) {
			await db.pluginContent.delete({ where: { id } }).catch(() => undefined);
		}
		for (const id of createdUserIds.splice(0)) {
			await db.user.delete({ where: { id } }).catch(() => undefined);
		}
	});

	afterAll(async () => {
		await db.$disconnect();
	});
});
