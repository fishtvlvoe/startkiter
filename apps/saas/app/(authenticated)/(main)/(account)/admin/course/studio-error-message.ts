import { COURSE_STUDIO_ERROR_CODES } from "@startkiter/api/modules/course/errors";

export type CourseStudioErrorResponse = {
	error?: unknown;
	details?: unknown;
};

export function getCourseStudioErrorMessage(response: CourseStudioErrorResponse): string {
	if (
		response.error === COURSE_STUDIO_ERROR_CODES.INVALID_MDX_CONTENT &&
		typeof response.details === "string" &&
		response.details.trim()
	) {
		return response.details;
	}

	if (response.error === COURSE_STUDIO_ERROR_CODES.UNAUTHORIZED) {
		return "登入狀態已失效，請重新登入。";
	}

	if (response.error === COURSE_STUDIO_ERROR_CODES.FORBIDDEN) {
		return "你沒有 Course Studio 操作權限。";
	}

	return "儲存失敗，請檢查權限與連線。";
}
