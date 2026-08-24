import { db } from "@startkiter/database";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";

export const listMedia = courseOperatorProcedure
	.route({ method: "GET", path: "/course/media", tags: ["Course media"], summary: "List course media" })
	.input(z.object({
		type: z.enum(["VIDEO", "IMAGE"]).optional(),
		search: z.string().trim().max(200).optional(),
		page: z.number().int().min(1).default(1),
	}))
	.handler(async ({ input }) => {
		const search = input.search || undefined;
		const where = {
			type: input.type,
			...(search ? {
				OR: [
					{ filename: { contains: search, mode: "insensitive" as const } },
					{ url: { contains: search, mode: "insensitive" as const } },
					{ provider: { contains: search, mode: "insensitive" as const } },
				],
			} : {}),
		};
		const take = 50;
		const [media, total] = await Promise.all([
			db.media.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (input.page - 1) * take,
				take,
				include: { user: { select: { id: true, name: true, email: true } } },
			}),
			db.media.count({ where }),
		]);
		return { media, total, page: input.page, pageSize: take };
	});
