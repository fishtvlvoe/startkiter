import { db } from "@startkiter/database";
import { checkRegistry } from "@startkiter/course/src/course-pack/check-registry";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { decryptMissionFormValue } from "../lib/mission-form-value-crypto";

export const runMissionCheck = protectedProcedure
	.route({
		method: "POST",
		path: "/course/mission/check",
		tags: ["Course missions"],
		summary: "Run a named Mission external check",
	})
	.input(
		z.object({
			coursePackMissionId: z.string().trim().min(1).max(200),
			checkId: z.string().trim().min(1).max(200),
			params: z.record(z.string(), z.string()).default({}),
		}),
	)
	.handler(async ({ input, context }) => {
		const implementation = checkRegistry[input.checkId];
		if (!implementation) {
			return { status: "failed" as const, reasonCode: "unknown_check_id" as const };
		}

		const rows = await db.missionFormValue.findMany({
			where: {
				userId: context.user.id,
				coursePackMissionId: input.coursePackMissionId,
			},
			select: { fieldKey: true, encryptedValue: true },
		});

		const encryptionSecret = process.env.SETTINGS_ENCRYPTION_KEY ?? "";
		const formValues: Record<string, string> = {};
		for (const row of rows) {
			const decrypted = decryptMissionFormValue(row.encryptedValue, encryptionSecret);
			if (decrypted !== null) {
				formValues[row.fieldKey] = decrypted;
			}
		}

		return implementation(input.params, {
			userId: context.user.id,
			coursePackMissionId: input.coursePackMissionId,
			formValues,
		});
	});
