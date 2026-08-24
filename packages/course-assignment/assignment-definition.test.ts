import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { createAssignmentDefinition, getAssignmentDefinition } from "./assignment-definition";

describe.sequential("Assignment definitions use shared PluginContent", () => {
	const createdContentIds: string[] = [];
	const createdUserIds: string[] = [];

	it("creates and retrieves a definition by pluginId and type", async () => {
		const user = await db.user.create({
			data: {
				name: "Assignment test operator",
				email: `assignment-${randomUUID()}@example.com`,
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		createdUserIds.push(user.id);

		const created = await createAssignmentDefinition({
			authorId: user.id,
			title: "第一次作業",
			body: {
				lessonId: "lesson-assignment-1",
				description: "請完成一段說明。",
				submissionType: "TEXT_AND_FILES",
				editorMode: "RICH_TEXT",
				minWords: 10,
				maxWords: 500,
				maxImages: 1,
				maxImageSize: 2_000_000,
				maxFiles: 1,
				maxFileSize: 5_000_000,
				allowedExtensions: ["pdf", "txt"],
				gradingType: "SCORE",
				passingScore: 60,
			},
		});
		createdContentIds.push(created.id);

		expect(created.pluginId).toBe("assignment");
		expect(created.type).toBe("assignment-definition");
		await db.pluginContent.update({
			where: { id: created.id },
			data: { body: { ...created.body, description: '<p>安全文字</p><script>alert("xss")</script>' } },
		});
		expect(await getAssignmentDefinition(created.id)).toMatchObject({
			id: created.id,
			title: "第一次作業",
			body: { description: "<p>安全文字</p>" },
		});
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
