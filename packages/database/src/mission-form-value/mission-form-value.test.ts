import { randomUUID } from "node:crypto";

import { afterAll, afterEach, describe, expect, it } from "vitest";

import { db } from "../../prisma/client";

describe.sequential("MissionFormValue database behavior", () => {
	const createdUserIds: string[] = [];
	const createdCoursePackIds: string[] = [];

	afterEach(async () => {
		for (const coursePackId of createdCoursePackIds.splice(0)) {
			await db.coursePack.delete({ where: { id: coursePackId } }).catch(() => undefined);
		}

		for (const userId of createdUserIds.splice(0)) {
			await db.user.delete({ where: { id: userId } }).catch(() => undefined);
		}
	});

	afterAll(async () => {
		await db.$disconnect();
	});

	it("upserts the same user, mission, and field combination instead of creating a duplicate", async () => {
		const user = await db.user.create({
			data: {
				name: "Mission value test user",
				email: `mission-value-${randomUUID()}@example.com`,
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		createdUserIds.push(user.id);

		const coursePack = await db.coursePack.create({
			data: {
				sourcePackId: `mission-value-pack-${randomUUID()}`,
				title: "Mission value test pack",
				schemaVersion: "1.0.0",
				learningOutcomes: [],
				importedBy: user.id,
				missions: {
					create: {
						missionId: "mission-value-test",
						title: "Mission value test mission",
						goal: "Persist one field",
						sortOrder: 0,
						missionData: {},
					},
				},
			},
			include: { missions: true },
		});
		createdCoursePackIds.push(coursePack.id);
		const mission = coursePack.missions[0];
		expect(mission).toBeDefined();
		if (!mission) return;

		await db.missionFormValue.upsert({
			where: {
				userId_coursePackMissionId_fieldKey: {
					userId: user.id,
					coursePackMissionId: mission.id,
					fieldKey: "bunnyApiKey",
				},
			},
			create: {
				userId: user.id,
				coursePackMissionId: mission.id,
				fieldKey: "bunnyApiKey",
				encryptedValue: "cipher-one",
			},
			update: { encryptedValue: "cipher-two" },
		});
		await db.missionFormValue.upsert({
			where: {
				userId_coursePackMissionId_fieldKey: {
					userId: user.id,
					coursePackMissionId: mission.id,
					fieldKey: "bunnyApiKey",
				},
			},
			create: {
				userId: user.id,
				coursePackMissionId: mission.id,
				fieldKey: "bunnyApiKey",
				encryptedValue: "cipher-two",
			},
			update: { encryptedValue: "cipher-two" },
		});

		const records = await db.missionFormValue.findMany({
			where: { userId: user.id, coursePackMissionId: mission.id, fieldKey: "bunnyApiKey" },
		});

		expect(records).toHaveLength(1);
		expect(records[0]?.encryptedValue).toBe("cipher-two");
	});
});
