/**
 * 解析課程工作室網址列傳入的快速操作參數 (?action=)。
 */

export type StudioQuickActionResult =
	| { type: "none" }
	| { type: "open-course-dialog" }
	| {
			type: "open-lesson-dialog";
			courseId: string;
			chapterId: string;
			courseTitle: string;
			chapterTitle: string;
	  }
	| { type: "error"; message: string };

export interface StudioQuickActionCourse {
	id: string;
	title: string;
	chapters: Array<{
		id: string;
		title: string;
		order: number;
	}>;
}

/**
 * 依據 action 參數與當前載入的課程清單，解析應觸發的動作。
 * - new-course: 開啟新增課程視窗
 * - new-lesson: 開啟新增單元視窗（固定加到第一門課 order 最大的最後一個章節）
 *   - 若無課程，回傳錯誤「請先新增課程，再新增單元」
 *   - 若第一門課無章節，回傳錯誤「請先新增章節，再新增單元」
 * - 其他不支援或未帶 action: 回傳 none
 */
export function resolveStudioQuickAction(
	action: string | null,
	courses: StudioQuickActionCourse[],
): StudioQuickActionResult {
	if (action === "new-course") {
		return { type: "open-course-dialog" };
	}

	if (action === "new-lesson") {
		if (courses.length === 0) {
			return { type: "error", message: "請先新增課程，再新增單元" };
		}

		const firstCourse = courses[0];
		if (!firstCourse.chapters || firstCourse.chapters.length === 0) {
			return { type: "error", message: "請先新增章節，再新增單元" };
		}

		// 選取 order 最大的章節
		const lastChapter = firstCourse.chapters.reduce((max, current) =>
			current.order > max.order ? current : max,
		);

		return {
			type: "open-lesson-dialog",
			courseId: firstCourse.id,
			chapterId: lastChapter.id,
			courseTitle: firstCourse.title,
			chapterTitle: lastChapter.title,
		};
	}

	return { type: "none" };
}

export type StudioQuickActionDecision =
	| { type: "skip"; reason: "no-action" | "not-loaded" | "already-handled" }
	| { type: "execute"; result: StudioQuickActionResult };

/**
 * 依據 action 參數、課程載入狀態與前次處理紀錄，決定是否執行動作。
 * - 若無 action，略過 (no-action)
 * - 若課程尚未載入，等待載入 (not-loaded)
 * - 若同一個 action 已被處理過（例如 Strict Mode 雙次觸發），略過 (already-handled)
 * - 否則解析並執行動作
 */
export function decideStudioQuickAction(params: {
	action: string | null;
	coursesLoaded: boolean;
	lastHandledAction: string | null;
	courses: StudioQuickActionCourse[];
}): StudioQuickActionDecision {
	const { action, coursesLoaded, lastHandledAction, courses } = params;

	if (!action) {
		return { type: "skip", reason: "no-action" };
	}

	if (!coursesLoaded) {
		return { type: "skip", reason: "not-loaded" };
	}

	if (lastHandledAction === action) {
		return { type: "skip", reason: "already-handled" };
	}

	const result = resolveStudioQuickAction(action, courses);
	return { type: "execute", result };
}
