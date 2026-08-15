export type LessonSummary = {
	id: string;
	title: string;
	order: number;
};

export type LessonDetail = LessonSummary & {
	description: string;
	/** 僅在授權通過後才應回傳給客戶端 */
	mediaUrl: string;
	mediaKind: "placeholder" | "video";
};

/**
 * MVP 靜態目錄。媒體先用 placeholder，之後可換成 Bunny signed URL。
 * 改寫抽自 thetu 觀看殼的「單元清單」概念，不抽學院 CMS。
 */
export const MVP_LESSONS: LessonDetail[] = [
	{
		id: "lesson-01",
		title: "開站包是什麼、為什麼要買斷",
		order: 1,
		description: "產品定位、8800 一次買斷、課與終身代碼包同一 SKU。",
		mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
		mediaKind: "video",
	},
	{
		id: "lesson-02",
		title: "站殼、登入與結帳路徑",
		order: 2,
		description: "Better Auth、PAYUNi、Order.courseAccess 怎麼串起來。",
		mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
		mediaKind: "video",
	},
	{
		id: "lesson-03",
		title: "課程模組與權限閘門",
		order: 3,
		description: "付了才能播；退款後 courseAccess=false 必須 403。",
		mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
		mediaKind: "video",
	},
];

export function listLessons(): LessonSummary[] {
	return MVP_LESSONS.map(({ id, title, order }) => ({ id, title, order })).sort(
		(a, b) => a.order - b.order,
	);
}

export function getLesson(lessonId: string): LessonDetail | null {
	return MVP_LESSONS.find((lesson) => lesson.id === lessonId) ?? null;
}

/** 給未授權回應用：不含 mediaUrl */
export function toPublicLessonMeta(lesson: LessonDetail): LessonSummary & { description: string } {
	return {
		id: lesson.id,
		title: lesson.title,
		order: lesson.order,
		description: lesson.description,
	};
}
