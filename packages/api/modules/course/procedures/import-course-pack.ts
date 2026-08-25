import { randomUUID } from "node:crypto";

import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { validateCoursePackEnvelope, type CoursePackEnvelope } from "../../../../course/src/course-pack/schema";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";

export const importCoursePack = courseOperatorProcedure
	.route({
		method: "POST",
		path: "/course/packs/import",
		tags: ["Course packs"],
		summary: "Import a Course Pack",
	})
	.input(z.object({ envelope: z.unknown() }))
	.handler(async ({ input, context }) => {
		const validation = validateCoursePackEnvelope(input.envelope);
		if (!validation.success) {
			throw new ORPCError("BAD_REQUEST", {
				data: { errors: validation.errors },
			});
		}

		const envelope: CoursePackEnvelope = validation.data;
		const coursePack = envelope.course_pack;
		const imported = await db.$transaction(async (transaction) => {
			await transaction.coursePack.updateMany({
				where: { sourcePackId: coursePack.id, status: "active" },
				data: { status: "superseded" },
			});

			return transaction.coursePack.create({
				data: {
					id: randomUUID(),
					sourcePackId: coursePack.id,
					title: coursePack.title,
					schemaVersion: envelope.schema_version,
					learningOutcomes: coursePack.learning_outcomes,
					status: "active",
					importedBy: context.user.id,
					missions: {
						create: coursePack.missions.map((mission, sortOrder) => ({
							id: randomUUID(),
							missionId: mission.id,
							title: mission.title,
							goal: mission.goal,
							sortOrder,
							missionData: mission,
						})),
					},
				},
			});
		});

		return {
			id: imported.id,
			sourcePackId: imported.sourcePackId,
			title: imported.title,
			missionCount: coursePack.missions.length,
			importedAt: imported.importedAt.toISOString(),
		};
	});
