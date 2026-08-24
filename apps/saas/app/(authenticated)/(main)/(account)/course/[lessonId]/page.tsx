import { auth } from "@startkiter/auth";
import type { WatermarkPlayerSettings } from "@startkiter/course";
import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
import { db } from "@startkiter/database";
import { createProcedureClient, ORPCError } from "@orpc/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { courseRouter } from "@startkiter/api/modules/course/router";
import { AcademyClassroomClient } from "./classroom-client";
import { OnboardingSurveyModal } from "./onboarding-survey-modal";

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
	courseTitle: string;
	watermarkSetting: Omit<WatermarkPlayerSettings, "email" | "courseTitle"> | null;
}

interface ChapterData {
	id: string;
	title: string;
	lessons: LessonData[];
}

function normalizeWatermarkSetting(setting: {
	enabled: boolean;
	showEmail: boolean;
	showCourseTitle: boolean;
	showTimestamp: boolean;
	emailDisplayMode: string;
	opacityPercent: number;
	textSize: string;
	movementMode: string;
	moveIntervalSec: number;
	tamperPauseEnabled: boolean;
	} | null): Omit<WatermarkPlayerSettings, "email" | "courseTitle"> | null {
	if (!setting) return null;

	return {
		enabled: setting.enabled,
		showEmail: setting.showEmail,
		showCourseTitle: setting.showCourseTitle,
		showTimestamp: setting.showTimestamp,
		emailDisplayMode: setting.emailDisplayMode === "MASKED" ? "MASKED" : "FULL",
		opacityPercent: Math.min(100, Math.max(1, setting.opacityPercent)),
		textSize: setting.textSize === "SM" || setting.textSize === "LG" ? setting.textSize : "MD",
		movementMode: setting.movementMode === "CORNERS" ? "CORNERS" : "STANDARD",
		moveIntervalSec: Math.min(3600, Math.max(1, setting.moveIntervalSec)),
		tamperPauseEnabled: setting.tamperPauseEnabled,
	};
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
			course: {
				select: {
					title: true,
					watermarkSetting: {
						select: {
							enabled: true,
							showEmail: true,
							showCourseTitle: true,
							showTimestamp: true,
							emailDisplayMode: true,
							opacityPercent: true,
							textSize: true,
							movementMode: true,
							moveIntervalSec: true,
							tamperPauseEnabled: true,
						},
					},
				},
			},
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
				courseTitle: ch.course.title,
				watermarkSetting: normalizeWatermarkSetting(ch.course.watermarkSetting),
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

	const currentChapter = chaptersFromDb.find((chapter) =>
		chapter.lessons.some((lesson) => lesson.id === lessonId),
	);
	const courseId = currentChapter?.courseId;
	let showOnboardingSurvey = false;
	if (session?.user?.id && courseId) {
		const hasCourseAccess = await userCanAccessCourseId(session.user.id, courseId);
		if (hasCourseAccess) {
			const existingSurvey = await db.courseOnboardingSurveyResponse.findUnique({
				where: {
					userId_courseId: { userId: session.user.id, courseId },
				},
				select: { id: true },
			});
			showOnboardingSurvey = !existingSurvey;
		}
	}

	return (
		<>
			<AcademyClassroomClient
				initialLesson={currentLesson}
				curriculum={curriculum}
				viewerEmail={session?.user?.email ?? ""}
			/>
			{courseId && (
				<OnboardingSurveyModal courseId={courseId} open={showOnboardingSurvey} />
			)}
		</>
	);
}
