import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { encryptMissionFormValue } from "../lib/mission-form-value-crypto";

export const submitMissionFormValue = protectedProcedure
	.route({
		method: "POST",
		path: "/course/mission/form-value",
		tags: ["Course missions"],
		summary: "Store a learner's Mission form value",
	})
	.input(
		z.object({
			coursePackMissionId: z.string().trim().min(1).max(200),
			fieldKey: z.string().trim().min(1).max(200),
			value: z.string().max(50_000),
		}),
	)
	.handler(async ({ input, context }) => {
		const encryptionSecret = process.env.SETTINGS_ENCRYPTION_KEY ?? "";
		if (!encryptionSecret.trim()) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "Mission form value encryption is unavailable.",
			});
		}

		const encryptedValue = encryptMissionFormValue(input.value, encryptionSecret);

		await db.missionFormValue.upsert({
			where: {
				userId_coursePackMissionId_fieldKey: {
					userId: context.user.id,
					coursePackMissionId: input.coursePackMissionId,
					fieldKey: input.fieldKey,
				},
			},
			create: {
				userId: context.user.id,
				coursePackMissionId: input.coursePackMissionId,
				fieldKey: input.fieldKey,
				encryptedValue,
			},
			update: { encryptedValue },
		});

		return { success: true };
	});
