export type PlaybackDecision =
	| { status: "ok"; lessonId: string }
	| { status: "unauthorized" }
	| { status: "forbidden" }
	| { status: "not_found" };

/**
 * 雙層閘的決策核心：先 session，再 courseAccess，再 lesson 存在。
 * route 層負責把結果映射成 HTTP。
 */
export function decideLessonPlayback(args: {
	sessionPresent: boolean;
	hasCourseAccess: boolean;
	lessonExists: boolean;
	lessonId: string;
}): PlaybackDecision {
	if (!args.sessionPresent) {
		return { status: "unauthorized" };
	}
	if (!args.hasCourseAccess) {
		return { status: "forbidden" };
	}
	if (!args.lessonExists) {
		return { status: "not_found" };
	}
	return { status: "ok", lessonId: args.lessonId };
}
