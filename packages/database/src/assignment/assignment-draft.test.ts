import { db } from "../../prisma/client";
import { afterAll, describe, expect, it } from "vitest";

export async function findAssignmentDraftForTypeCheck(pluginContentId: string, userId: string) {
	return db.assignmentDraft.findUnique({
		where: { pluginContentId_userId: { pluginContentId, userId } },
	});
}

describe("AssignmentDraft unique learner selector", () => {
	it("can address one draft per assignment and learner", async () => {
		await expect(findAssignmentDraftForTypeCheck("missing-assignment", "missing-user")).resolves.toBeNull();
	});

	afterAll(async () => {
		await db.$disconnect();
	});
});
