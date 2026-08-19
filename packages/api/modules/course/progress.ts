export type CourseProgress = {
	completedCount: number;
	completedLessonIds: string[];
	percentage: number;
	totalCount: number;
};

type BlockProgressWriter = {
	create: (args: {
		data: { completedBlockIds: string[]; lessonId: string; userId: string };
	}) => Promise<unknown>;
	findUnique: (args: {
		select: { completedBlockIds: true };
		where: { userId_lessonId: { lessonId: string; userId: string } };
	}) => Promise<{ completedBlockIds: string[] } | null>;
	updateMany: (args: {
		data: { completedBlockIds: { push: string } };
		where: {
			NOT: { completedBlockIds: { has: string } };
			lessonId: string;
			userId: string;
		};
	}) => Promise<{ count: number }>;
};

function isUniqueConstraintError(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: unknown }).code === "P2002"
	);
}

/**
 * Adds one completed block without a read-modify-write race. PostgreSQL applies
 * the conditional array push atomically; a simultaneous first insert retries as
 * an update after its unique-key collision.
 */
export async function appendCompletedBlockId(
	writer: BlockProgressWriter,
	{ blockId, lessonId, userId }: { blockId: string; lessonId: string; userId: string },
) {
	const conditionalPush = () =>
		writer.updateMany({
			data: { completedBlockIds: { push: blockId } },
			where: {
				NOT: { completedBlockIds: { has: blockId } },
				lessonId,
				userId,
			},
		});

	if ((await conditionalPush()).count > 0) {
		return;
	}

	const existing = await writer.findUnique({
		select: { completedBlockIds: true },
		where: { userId_lessonId: { lessonId, userId } },
	});
	if (existing?.completedBlockIds.includes(blockId)) {
		return;
	}

	try {
		await writer.create({ data: { completedBlockIds: [blockId], lessonId, userId } });
	} catch (error) {
		if (!isUniqueConstraintError(error)) {
			throw error;
		}
		await conditionalPush();
	}
}

export function calculateCourseProgress({
	completedLessonIds,
	publishedLessonIds,
}: {
	completedLessonIds: readonly string[];
	publishedLessonIds: readonly string[];
}): CourseProgress {
	const published = new Set(publishedLessonIds);
	const completedLessonIdsInCurriculum = [...new Set(completedLessonIds)].filter((id) =>
		published.has(id),
	);
	const totalCount = published.size;

	return {
		completedCount: completedLessonIdsInCurriculum.length,
		completedLessonIds: completedLessonIdsInCurriculum,
		percentage: totalCount
			? Math.round((completedLessonIdsInCurriculum.length / totalCount) * 100)
			: 0,
		totalCount,
	};
}
