import { db } from "@startkiter/database";

import { courseOperatorProcedure } from "../lib/course-operator";

export const listCoursePacks = courseOperatorProcedure
	.route({
		method: "GET",
		path: "/course/packs",
		tags: ["Course packs"],
		summary: "List imported Course Packs",
	})
	.handler(async () => {
		const coursePacks = await db.coursePack.findMany({
			orderBy: { importedAt: "desc" },
			include: { _count: { select: { missions: true } } },
		});

		return coursePacks.map((coursePack) => ({
			id: coursePack.id,
			sourcePackId: coursePack.sourcePackId,
			title: coursePack.title,
			status: coursePack.status as "active" | "superseded",
			missionCount: coursePack._count.missions,
			importedAt: coursePack.importedAt.toISOString(),
		}));
	});
