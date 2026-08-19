import { db } from "@startkiter/database";
import { notFound } from "next/navigation";
import { AcademyClassroomClient } from "./classroom-client";

type LessonPageProps = {
	params: Promise<{ lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
	const { lessonId } = await params;

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

	const curriculum = chaptersFromDb.map((ch) => ({
		id: ch.id,
		title: ch.title,
		lessons: ch.lessons.map((l) => ({
			id: l.id,
			title: l.title,
			duration: l.videoDuration || "10:00",
			isFreePreview: l.isFreePreview,
			videoUrl: l.videoUrl || "",
			provider: l.videoProvider || undefined,
			content: l.content || "",
			aiContext: l.aiContext || "",
		})),
	}));

	const allLessons = curriculum.flatMap((c) => c.lessons);
	const currentLesson = allLessons.find((l) => l.id === lessonId) || allLessons[0];

	if (!currentLesson) {
		notFound();
	}

	return <AcademyClassroomClient initialLesson={currentLesson} curriculum={curriculum} />;
}
