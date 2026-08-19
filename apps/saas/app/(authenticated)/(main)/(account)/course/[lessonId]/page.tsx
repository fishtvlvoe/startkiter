import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { createProcedureClient, ORPCError } from "@orpc/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { courseRouter } from "@startkiter/api/modules/course/router";
import { AcademyClassroomClient } from "./classroom-client";

type LessonPageProps = {
	params: Promise<{ lessonId: string }>;
};

interface LessonData {
	id: string;
	title: string;
	duration: string;
	isFreePreview: boolean;
	videoUrl: string;
	provider?: string;
	content: string;
	aiContext: string;
}

interface ChapterData {
	id: string;
	title: string;
	lessons: LessonData[];
}

function stripSensitiveFields(lesson: LessonData): LessonData {
	return {
		...lesson,
		videoUrl: "",
		content: "",
		aiContext: "",
	};
}

export default async function LessonPage({ params }: LessonPageProps) {
	const { lessonId } = await params;
	const requestHeaders = await headers();
	const session = await auth.api.getSession({ headers: requestHeaders });

	// 從 PostgreSQL 資料庫真實讀取已發布課綱
	const chaptersFromDb = await db.chapter.findMany({
		where: {
			course: { status: "PUBLISHED" },
		},
		orderBy: { order: "asc" },
		include: {
			lessons: {
				where: { status: "PUBLISHED" },
				orderBy: { order: "asc" },
			},
		},
	});

	if (!chaptersFromDb.length) {
		notFound();
	}

	// 使用 oRPC getLessonDetail 逐單元驗證觀看權限
	const getLessonDetail = createProcedureClient(courseRouter.getLessonDetail, {
		context: {
			headers: requestHeaders,
			...(session?.user?.id ? { user: { id: session.user.id } } : {}),
		} as any,
	});

	const curriculum: ChapterData[] = [];
	for (const ch of chaptersFromDb) {
		const chapterLessons: LessonData[] = [];
		for (const l of ch.lessons) {
			const baseLesson: LessonData = {
				id: l.id,
				title: l.title,
				duration: l.videoDuration || "10:00",
				isFreePreview: l.isFreePreview,
				videoUrl: l.videoUrl || "",
				provider: l.videoProvider || undefined,
				content: l.content || "",
				aiContext: l.aiContext || "",
			};

			try {
				await getLessonDetail({ lessonId: l.id });
				chapterLessons.push(baseLesson);
			} catch (error) {
				if (error instanceof ORPCError) {
					// 未登入、非付費或未發布的單元：只保留大綱欄位，移除敏感內容
					chapterLessons.push(stripSensitiveFields(baseLesson));
				} else {
					throw error;
				}
			}
		}
		curriculum.push({
			id: ch.id,
			title: ch.title,
			lessons: chapterLessons,
		});
	}

	const allLessons = curriculum.flatMap((c) => c.lessons);
	const currentLesson = allLessons.find((l) => l.id === lessonId) || allLessons[0];

	if (!currentLesson) {
		notFound();
	}

	return <AcademyClassroomClient initialLesson={currentLesson} curriculum={curriculum} />;
}
