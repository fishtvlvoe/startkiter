import slugify from "@sindresorhus/slugify";
import { db, PublishStatus, type Prisma, VideoProvider } from "@startkiter/database";
import { parseCourseMdx, validateCourseMdx } from "@startkiter/course/src/mdx/course-mdx";
import { resolveVideoSource } from "@startkiter/course/video-resolver";
import { parseTimecode } from "@startkiter/course/timecode";
import { z } from "zod";

const statusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const shortText = z.string().trim().min(1).max(160);
const optionalText = z.string().trim().max(20_000);

const strict = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();

export const studioCommandSchema = z.discriminatedUnion("action", [
	strict({
		action: z.literal("resolveVideo"),
		videoUrl: z.string().trim().min(1).max(2_000),
	}),
	strict({
		action: z.literal("createCourse"),
		description: optionalText.optional(),
		slug: z.string().trim().max(120).optional(),
		title: shortText,
	}),
	strict({
		action: z.literal("updateCourse"),
		description: optionalText.nullable().optional(),
		id: z.string().min(1),
		status: statusSchema.optional(),
		title: shortText.optional(),
	}),
	strict({ action: z.literal("deleteCourse"), id: z.string().min(1) }),
	strict({
		action: z.literal("createChapter"),
		courseId: z.string().min(1),
		title: shortText,
	}),
	strict({
		action: z.literal("updateChapter"),
		id: z.string().min(1),
		title: shortText,
	}),
	strict({ action: z.literal("deleteChapter"), id: z.string().min(1) }),
	strict({
		action: z.literal("reorderChapters"),
		courseId: z.string().min(1),
		orderedChapterIds: z.array(z.string().min(1)).min(1),
	}),
	strict({
		action: z.literal("createLesson"),
		chapterId: z.string().min(1),
		slug: z.string().trim().max(160).optional(),
		title: shortText,
	}),
	strict({
		action: z.literal("updateLesson"),
		aiContext: optionalText.nullable().optional(),
		content: optionalText.nullable().optional(),
		id: z.string().min(1),
		isFreePreview: z.boolean().optional(),
		status: statusSchema.optional(),
		title: shortText.optional(),
		videoDuration: z.string().trim().max(32).nullable().optional(),
		videoUrl: z.string().trim().max(2_000).nullable().optional(),
	}),
	strict({ action: z.literal("deleteLesson"), id: z.string().min(1) }),
	strict({
		action: z.literal("moveLesson"),
		beforeLessonId: z.string().min(1).nullable().optional(),
		id: z.string().min(1),
		toChapterId: z.string().min(1),
	}),
	strict({
		action: z.literal("createFolder"),
		name: shortText,
	}),
	strict({
		action: z.literal("renameFolder"),
		id: z.string().min(1),
		name: shortText,
	}),
	strict({ action: z.literal("deleteFolder"), id: z.string().min(1) }),
	strict({
		action: z.literal("moveFolderItem"),
		beforeItemId: z.string().min(1).nullable().optional(),
		id: z.string().min(1),
		toFolderId: z.string().min(1),
	}),
	strict({
		action: z.literal("setFolderCollapsed"),
		folderId: z.string().min(1),
		isCollapsed: z.boolean(),
	}),
	strict({
		action: z.literal("reorderFolders"),
		orderedFolderIds: z.array(z.string().min(1)).min(1),
	}),
]);

export type StudioCommand = z.infer<typeof studioCommandSchema>;

export class CourseStudioError extends Error {
	constructor(
		message: string,
		public readonly status = 400,
	) {
		super(message);
		this.name = "CourseStudioError";
	}
}

type Transaction = Prisma.TransactionClient;

function requireResult<T>(value: T | null, message = "Requested course content does not exist.") {
	if (!value) {
		throw new CourseStudioError(message, 404);
	}
	return value;
}

function normalizedSlug(value: string) {
	const slug = slugify(value, { separator: "-", decamelize: false }).replace(/^-+|-+$/g, "");
	return slug || "course";
}

async function uniqueLessonSlug(title: string) {
	const base = normalizedSlug(title);
	const existing = await db.lesson.findFirst({
		where: { slug: base },
		select: { id: true },
	});
	return existing ? base + "-" + Date.now().toString(36) : base;
}

function durationSeconds(value: string | null | undefined) {
	if (!value) {
		return null;
	}
	try {
		const seconds = parseTimecode(value);
		return seconds > 0 ? seconds : null;
	} catch {
		return null;
	}
}

function assertPublishableLesson({
	content,
	videoDuration,
	videoUrl,
}: {
	content: string | null;
	videoDuration: string | null;
	videoUrl: string | null;
}) {
	if (!videoUrl) {
		throw new CourseStudioError("Published lessons need an approved video URL.");
	}
	const resolved = resolveVideoSource(videoUrl);
	if (!resolved.ok) {
		throw new CourseStudioError(resolved.error);
	}
	const verifiedDurationSeconds = durationSeconds(videoDuration);
	if (!verifiedDurationSeconds) {
		throw new CourseStudioError("Published lessons need verified video duration metadata.");
	}
	const contentResult = validateCourseMdx(content, { durationSeconds: verifiedDurationSeconds });
	if (!contentResult.ok) {
		throw new CourseStudioError(contentResult.error);
	}
	return resolved;
}

async function updateOrder(
	tx: Transaction,
	model: "chapter" | "studioFolder",
	ids: readonly string[],
) {
	await Promise.all(
		ids.map((id, index) =>
			model === "chapter"
				? tx.chapter.update({ where: { id }, data: { order: index } })
				: tx.studioFolder.update({ where: { id }, data: { order: index } }),
		),
	);
}

async function assertExactIds(actualIds: readonly string[], requestedIds: readonly string[]) {
	if (
		actualIds.length !== requestedIds.length ||
		new Set(actualIds).size !== actualIds.length ||
		new Set(requestedIds).size !== requestedIds.length ||
		actualIds.some((id) => !requestedIds.includes(id))
	) {
		throw new CourseStudioError("The requested ordering does not match the persisted records.");
	}
}

export async function getStudioSnapshot(userId: string) {
	const [courses, folders] = await Promise.all([
		db.course.findMany({
			orderBy: [{ createdAt: "asc" }, { id: "asc" }],
			include: {
				chapters: {
					orderBy: [{ order: "asc" }, { id: "asc" }],
					include: {
						lessons: {
							orderBy: [{ order: "asc" }, { id: "asc" }],
						},
					},
				},
			},
		}),
		db.studioFolder.findMany({
			orderBy: [{ order: "asc" }, { id: "asc" }],
			include: {
				collapseStates: {
					where: { userId },
					select: { isCollapsed: true },
				},
				items: {
					orderBy: [{ order: "asc" }, { id: "asc" }],
				},
			},
		}),
	]);

	return {
		courses: courses.map((course) => ({
			...course,
			chapters: course.chapters.map((chapter) => ({
				...chapter,
				lessons: chapter.lessons.map((lesson) => {
					const resolved = lesson.videoUrl ? resolveVideoSource(lesson.videoUrl) : null;
					return {
						...lesson,
						videoSource: resolved?.ok ? resolved : null,
					};
				}),
			})),
		})),
		folders: folders.map(({ collapseStates, ...folder }) => ({
			...folder,
			isCollapsed: collapseStates[0]?.isCollapsed ?? false,
		})),
	};
}

export async function executeStudioCommand(command: StudioCommand, userId: string) {
	switch (command.action) {
		case "resolveVideo": {
			const resolved = resolveVideoSource(command.videoUrl);
			if (!resolved.ok) {
				throw new CourseStudioError(resolved.error);
			}
			return resolved;
		}
		case "createCourse": {
			const slug = normalizedSlug(command.slug || command.title);
			const duplicate = await db.course.findFirst({ where: { slug }, select: { id: true } });
			if (duplicate) {
				throw new CourseStudioError("Course slug already exists.", 409);
			}
			return db.course.create({
				data: {
					description: command.description || null,
					slug,
					status: PublishStatus.DRAFT,
					title: command.title,
				},
			});
		}
		case "updateCourse": {
			const current = requireResult(
				await db.course.findUnique({ where: { id: command.id } }),
			);
			const status = command.status as PublishStatus | undefined;
			if (status === PublishStatus.PUBLISHED) {
				const publishedLessons = await db.lesson.findMany({
					where: { chapter: { courseId: current.id }, status: PublishStatus.PUBLISHED },
					select: { content: true, videoDuration: true, videoUrl: true },
				});
				if (publishedLessons.length === 0) {
					throw new CourseStudioError("Publish at least one valid lesson before publishing a course.");
				}
				for (const lesson of publishedLessons) {
					assertPublishableLesson(lesson);
				}
			}
			return db.course.update({
				where: { id: current.id },
				data: {
					...(command.title !== undefined ? { title: command.title } : {}),
					...(command.description !== undefined ? { description: command.description } : {}),
					...(status ? { status } : {}),
					...(status === PublishStatus.PUBLISHED && !current.publishedAt
						? { publishedAt: new Date() }
						: {}),
				},
			});
		}
		case "deleteCourse":
			requireResult(await db.course.findUnique({ where: { id: command.id } }));
			return db.course.delete({ where: { id: command.id } });
		case "createChapter": {
			requireResult(await db.course.findUnique({ where: { id: command.courseId } }));
			const count = await db.chapter.count({ where: { courseId: command.courseId } });
			return db.chapter.create({
				data: { courseId: command.courseId, order: count, title: command.title },
			});
		}
		case "updateChapter":
			requireResult(await db.chapter.findUnique({ where: { id: command.id } }));
			return db.chapter.update({ where: { id: command.id }, data: { title: command.title } });
		case "deleteChapter":
			requireResult(await db.chapter.findUnique({ where: { id: command.id } }));
			return db.chapter.delete({ where: { id: command.id } });
		case "reorderChapters": {
			const chapters = await db.chapter.findMany({
				where: { courseId: command.courseId },
				select: { id: true },
			});
			await assertExactIds(
				chapters.map((chapter) => chapter.id),
				command.orderedChapterIds,
			);
			await db.$transaction((tx) => updateOrder(tx, "chapter", command.orderedChapterIds));
			return { orderedChapterIds: command.orderedChapterIds };
		}
		case "createLesson": {
			requireResult(await db.chapter.findUnique({ where: { id: command.chapterId } }));
			const count = await db.lesson.count({ where: { chapterId: command.chapterId } });
			const slug = command.slug ? normalizedSlug(command.slug) : await uniqueLessonSlug(command.title);
			const duplicate = await db.lesson.findFirst({ where: { slug }, select: { id: true } });
			if (duplicate) {
				throw new CourseStudioError("Lesson slug already exists.", 409);
			}
			return db.lesson.create({
				data: {
					chapterId: command.chapterId,
					order: count,
					slug,
					status: PublishStatus.DRAFT,
					title: command.title,
				},
			});
		}
		case "updateLesson": {
			const current = requireResult(await db.lesson.findUnique({ where: { id: command.id } }));
			const nextVideoUrl = command.videoUrl === undefined ? current.videoUrl : command.videoUrl;
			const nextDuration =
				command.videoDuration === undefined ? current.videoDuration : command.videoDuration;
			const nextContent = command.content === undefined ? current.content : command.content;
			let videoProvider: VideoProvider | null | undefined;

			if (command.videoUrl !== undefined) {
				if (command.videoUrl) {
					const resolved = resolveVideoSource(command.videoUrl);
					if (!resolved.ok) {
						throw new CourseStudioError(resolved.error);
					}
					videoProvider = resolved.provider as VideoProvider;
				} else {
					videoProvider = null;
				}
			}
			if (command.content !== undefined) {
				const result = parseCourseMdx(command.content);
				if (!result.ok) {
					throw new CourseStudioError(result.error);
				}
			}
			const nextStatus = (command.status as PublishStatus | undefined) ?? current.status;
			if (nextStatus === PublishStatus.PUBLISHED) {
				const resolved = assertPublishableLesson({
					content: nextContent,
					videoDuration: nextDuration,
					videoUrl: nextVideoUrl,
				});
				videoProvider = resolved.provider as VideoProvider;
			}

			return db.lesson.update({
				where: { id: command.id },
				data: {
					...(command.title !== undefined ? { title: command.title } : {}),
					...(command.aiContext !== undefined ? { aiContext: command.aiContext } : {}),
					...(command.content !== undefined ? { content: command.content } : {}),
					...(command.isFreePreview !== undefined
						? { isFreePreview: command.isFreePreview }
						: {}),
					...(command.status !== undefined
						? { status: command.status as PublishStatus }
						: {}),
					...(command.videoUrl !== undefined ? { videoUrl: command.videoUrl } : {}),
					...(command.videoDuration !== undefined
						? { videoDuration: command.videoDuration }
						: {}),
					...(videoProvider !== undefined ? { videoProvider } : {}),
				},
			});
		}
		case "deleteLesson":
			requireResult(await db.lesson.findUnique({ where: { id: command.id } }));
			return db.lesson.delete({ where: { id: command.id } });
		case "moveLesson": {
			const lesson = requireResult(
				await db.lesson.findUnique({ where: { id: command.id }, include: { chapter: true } }),
			);
			const targetChapter = requireResult(
				await db.chapter.findUnique({ where: { id: command.toChapterId } }),
			);
			if (lesson.chapter.courseId !== targetChapter.courseId) {
				throw new CourseStudioError("Lessons can only move within the same course.");
			}

			await db.$transaction(async (tx) => {
				const targetLessons = await tx.lesson.findMany({
					where: { chapterId: targetChapter.id, id: { not: lesson.id } },
					orderBy: [{ order: "asc" }, { id: "asc" }],
					select: { id: true },
				});
				const beforeIndex = command.beforeLessonId
					? targetLessons.findIndex((item) => item.id === command.beforeLessonId)
					: -1;
				if (command.beforeLessonId && beforeIndex === -1) {
					throw new CourseStudioError("Target lesson ordering reference does not exist.", 404);
				}
				const orderedIds = targetLessons.map((item) => item.id);
				orderedIds.splice(beforeIndex === -1 ? orderedIds.length : beforeIndex, 0, lesson.id);
				await tx.lesson.update({
					where: { id: lesson.id },
					data: { chapterId: targetChapter.id },
				});
				await Promise.all(
					orderedIds.map((id, order) => tx.lesson.update({ where: { id }, data: { order } })),
				);
				if (lesson.chapterId !== targetChapter.id) {
					const sourceLessons = await tx.lesson.findMany({
						where: { chapterId: lesson.chapterId },
						orderBy: [{ order: "asc" }, { id: "asc" }],
						select: { id: true },
					});
					await Promise.all(
						sourceLessons.map((item, order) =>
							tx.lesson.update({ where: { id: item.id }, data: { order } }),
						),
					);
				}
			});
			return { lessonId: lesson.id, toChapterId: targetChapter.id };
		}
		case "createFolder": {
			return db.$transaction(async (tx) => {
				const count = await tx.studioFolder.count();
				const folder = await tx.studioFolder.create({
					data: { name: command.name, order: count },
				});
				const courseItem = await tx.studioFolderItem.findUnique({
					where: { moduleId: "course" },
					select: { id: true },
				});
				if (!courseItem) {
					await tx.studioFolderItem.create({
						data: { folderId: folder.id, moduleId: "course", order: 0 },
					});
				}
				return folder;
			});
		}
		case "renameFolder":
			requireResult(await db.studioFolder.findUnique({ where: { id: command.id } }));
			return db.studioFolder.update({ where: { id: command.id }, data: { name: command.name } });
		case "deleteFolder": {
			const folder = requireResult(
				await db.studioFolder.findUnique({
					where: { id: command.id },
					include: { items: true },
				}),
			);
			const otherFolder = await db.studioFolder.findFirst({
				where: { id: { not: folder.id } },
				orderBy: [{ order: "asc" }, { id: "asc" }],
				select: { id: true },
			});
			if (folder.items.some((item) => item.moduleId === "course") && !otherFolder) {
				throw new CourseStudioError("Move the course module to another folder before deleting this folder.");
			}
			return db.$transaction(async (tx) => {
				if (otherFolder) {
					for (const item of folder.items) {
						const count = await tx.studioFolderItem.count({ where: { folderId: otherFolder.id } });
						await tx.studioFolderItem.update({
							where: { id: item.id },
							data: { folderId: otherFolder.id, order: count },
						});
					}
				}
				return tx.studioFolder.delete({ where: { id: folder.id } });
			});
		}
		case "moveFolderItem": {
			const item = requireResult(await db.studioFolderItem.findUnique({ where: { id: command.id } }));
			const targetFolder = requireResult(
				await db.studioFolder.findUnique({ where: { id: command.toFolderId } }),
			);
			await db.$transaction(async (tx) => {
				const targetItems = await tx.studioFolderItem.findMany({
					where: { folderId: targetFolder.id, id: { not: item.id } },
					orderBy: [{ order: "asc" }, { id: "asc" }],
					select: { id: true },
				});
				const beforeIndex = command.beforeItemId
					? targetItems.findIndex((candidate) => candidate.id === command.beforeItemId)
					: -1;
				if (command.beforeItemId && beforeIndex === -1) {
					throw new CourseStudioError("Target module ordering reference does not exist.", 404);
				}
				const orderedIds = targetItems.map((candidate) => candidate.id);
				orderedIds.splice(beforeIndex === -1 ? orderedIds.length : beforeIndex, 0, item.id);
				await tx.studioFolderItem.update({
					where: { id: item.id },
					data: { folderId: targetFolder.id },
				});
				await Promise.all(
					orderedIds.map((id, order) =>
						tx.studioFolderItem.update({ where: { id }, data: { order } }),
					),
				);
				if (item.folderId !== targetFolder.id) {
					const sourceItems = await tx.studioFolderItem.findMany({
						where: { folderId: item.folderId },
						orderBy: [{ order: "asc" }, { id: "asc" }],
						select: { id: true },
					});
					await Promise.all(
						sourceItems.map((candidate, order) =>
							tx.studioFolderItem.update({ where: { id: candidate.id }, data: { order } }),
						),
					);
				}
			});
			return { folderId: targetFolder.id, itemId: item.id };
		}
		case "setFolderCollapsed":
			requireResult(await db.studioFolder.findUnique({ where: { id: command.folderId } }));
			return db.studioFolderCollapseState.upsert({
				where: {
					userId_folderId: {
						folderId: command.folderId,
						userId,
					},
				},
				create: {
					folderId: command.folderId,
					isCollapsed: command.isCollapsed,
					userId,
				},
				update: { isCollapsed: command.isCollapsed },
			});
		case "reorderFolders": {
			const folders = await db.studioFolder.findMany({ select: { id: true } });
			await assertExactIds(
				folders.map((folder) => folder.id),
				command.orderedFolderIds,
			);
			await db.$transaction((tx) => updateOrder(tx, "studioFolder", command.orderedFolderIds));
			return { orderedFolderIds: command.orderedFolderIds };
		}
	}
}
