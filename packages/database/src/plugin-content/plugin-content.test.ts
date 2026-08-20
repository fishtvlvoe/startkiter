import { randomUUID } from "node:crypto";

import { afterAll, afterEach, describe, expect, it } from "vitest";

import { db } from "../../prisma/client";

describe.sequential("PluginContent database constraints", () => {
	const createdUserIds: string[] = [];
	const createdPluginContentIds: string[] = [];

	async function createTestUser() {
		const user = await db.user.create({
			data: {
				name: "PluginContent test author",
				email: `plugin-content-${randomUUID()}@example.com`,
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});

		createdUserIds.push(user.id);
		return user;
	}

	afterEach(async () => {
		for (const pluginContentId of createdPluginContentIds.splice(0)) {
			try {
				await db.pluginContent.delete({ where: { id: pluginContentId } });
			} catch {
				// ignore cleanup errors
			}
		}

		const userId = createdUserIds.pop();
		if (!userId) return;

		try {
			await db.user.delete({ where: { id: userId } });
		} catch {
			// ignore cleanup errors
		}
	});

	afterAll(async () => {
		await db.$disconnect();
	});

	it("stores a course lesson and retrieves it by pluginId and type", async () => {
		const user = await createTestUser();

		const created = await db.pluginContent.create({
			data: {
				pluginId: "course",
				type: "lesson",
				title: "Lesson 1",
				body: { blocks: [{ text: "hello" }] },
				authorId: user.id,
			},
		});

		createdPluginContentIds.push(created.id);

		const found = await db.pluginContent.findMany({
			where: {
				pluginId: "course",
				type: "lesson",
			},
		});

		expect(found.map((record) => record.id)).toContain(created.id);
		const match = found.find((record) => record.id === created.id);
		expect(match).toBeDefined();
		expect(match?.title).toBe("Lesson 1");
		expect(match?.authorId).toBe(user.id);
	});

	it("rejects a record with a missing body", async () => {
		const user = await createTestUser();

		await expect(
			db.pluginContent.create({
				data: {
					pluginId: "course",
					type: "lesson",
					title: "Lesson without body",
					authorId: user.id,
					// @ts-expect-error body is required
					body: undefined,
				},
			}),
		).rejects.toMatchObject({
			message: expect.stringContaining("body"),
		});
	});
});
