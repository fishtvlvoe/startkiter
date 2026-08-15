export type LessonSummary = {
	id: string;
	title: string;
	order: number;
};

export type LessonMediaKind = "bunny_embed" | "placeholder";

export type LessonDetail = LessonSummary & {
	description: string;
	/** 僅在授權通過後才應回傳給客戶端 */
	mediaUrl: string;
	mediaKind: LessonMediaKind;
	isDemoFallback: boolean;
};

type LessonSeed = LessonSummary & {
	description: string;
	bunnyVideoId: string;
};

const PLACEHOLDER_MEDIA =
	"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

/**
 * MVP 靜態目錄。Bunny guid 可用 env 覆寫：BUNNY_LESSON_01_VIDEO_ID …
 */
const MVP_LESSON_SEEDS: LessonSeed[] = [
	{
		id: "lesson-01",
		title: "開站包是什麼、為什麼要買斷",
		order: 1,
		description: "產品定位、8800 一次買斷、課與終身代碼包同一 SKU。",
		bunnyVideoId: "efc1790b-83a8-46e4-a319-4d2b2761b9bc",
	},
	{
		id: "lesson-02",
		title: "站殼、登入與結帳路徑",
		order: 2,
		description: "Better Auth、PAYUNi、Order 權限怎麼串起來。",
		bunnyVideoId: "7ff482df-65bc-4914-8602-95e40090fdac",
	},
	{
		id: "lesson-03",
		title: "課程模組與權限閘門",
		order: 3,
		description: "付了才能播；退款後必須重新鎖住。",
		bunnyVideoId: "fb6be6c0-4c94-4eab-91bb-bfcba420336c",
	},
];

function envVideoOverride(
	lessonId: string,
	env: NodeJS.Dict<string | undefined> = process.env,
): string | undefined {
	const key = `BUNNY_LESSON_${lessonId.replace("lesson-", "").toUpperCase()}_VIDEO_ID`;
	const value = env[key]?.trim();
	return value || undefined;
}

export function buildBunnyEmbedUrl(libraryId: string, videoId: string): string {
	return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
}

export function resolveLessonMedia(
	seed: LessonSeed,
	env: NodeJS.Dict<string | undefined> = process.env,
): Pick<LessonDetail, "mediaUrl" | "mediaKind" | "isDemoFallback"> {
	const libraryId = env.BUNNY_LIBRARY_ID?.trim();
	const videoId = envVideoOverride(seed.id, env) || seed.bunnyVideoId;
	if (libraryId && videoId) {
		return {
			mediaUrl: buildBunnyEmbedUrl(libraryId, videoId),
			mediaKind: "bunny_embed",
			isDemoFallback: false,
		};
	}
	return {
		mediaUrl: PLACEHOLDER_MEDIA,
		mediaKind: "placeholder",
		isDemoFallback: true,
	};
}

export function listLessons(): LessonSummary[] {
	return MVP_LESSON_SEEDS.map(({ id, title, order }) => ({ id, title, order })).sort(
		(a, b) => a.order - b.order,
	);
}

export function getLesson(
	lessonId: string,
	env: NodeJS.Dict<string | undefined> = process.env,
): LessonDetail | null {
	const seed = MVP_LESSON_SEEDS.find((lesson) => lesson.id === lessonId);
	if (!seed) {
		return null;
	}
	const media = resolveLessonMedia(seed, env);
	return {
		id: seed.id,
		title: seed.title,
		order: seed.order,
		description: seed.description,
		...media,
	};
}

/** 給未授權回應用：不含 mediaUrl */
export function toPublicLessonMeta(
	lesson: LessonDetail,
): LessonSummary & { description: string } {
	return {
		id: lesson.id,
		title: lesson.title,
		order: lesson.order,
		description: lesson.description,
	};
}
