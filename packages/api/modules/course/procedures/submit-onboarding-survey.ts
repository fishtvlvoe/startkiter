import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { userCanAccessCourseId } from "../lib/course-access";

const surveyText = z.string().trim().max(2000);

const surveyResponseInput = z.object({
	goals: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
	purchaseFactors: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
	hesitation: surveyText.nullable().optional(),
	alternatives: surveyText.nullable().optional(),
	discoverySource: z.string().trim().max(200).nullable().optional(),
	discoverySourceOther: surveyText.nullable().optional(),
});

function isUniqueConstraintError(error: unknown): boolean {
	return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export const submitOnboardingSurvey = protectedProcedure
	.route({
		method: "POST",
		path: "/course/onboarding-survey",
		tags: ["Course"],
		summary: "Submit a course onboarding survey",
	})
	.input(
		z.object({
			courseId: z.string().trim().min(1),
			response: surveyResponseInput,
		}),
	)
	.handler(async ({ input, context }) => {
		const allowed = await userCanAccessCourseId(context.user.id, input.courseId);
		if (!allowed) {
			throw new ORPCError("FORBIDDEN");
		}

		try {
			await db.courseOnboardingSurveyResponse.create({
				data: {
					userId: context.user.id,
					courseId: input.courseId,
					goals: input.response.goals,
					purchaseFactors: input.response.purchaseFactors,
					hesitation: input.response.hesitation ?? null,
					alternatives: input.response.alternatives ?? null,
					discoverySource: input.response.discoverySource ?? null,
					discoverySourceOther: input.response.discoverySourceOther ?? null,
				},
			});
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				throw new ORPCError("CONFLICT", { message: "你已填寫過這門課的新生問卷。" });
			}
			throw error;
		}

		return { submitted: true };
	});
