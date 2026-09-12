import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("next/headers", () => ({
	headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/navigation", () => ({
	notFound: () => {
		throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: {
			findUnique: vi.fn(),
		},
		courseOnboardingSurveyResponse: {
			findUnique: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/api/modules/course/lib/course-access", () => ({
	userCanAccessCourseId: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/published-content-cache", () => ({
	getCachedPublishedCurriculum: vi.fn(),
	getCachedPublishedLessonById: vi.fn(),
}));

vi.mock("@startkiter/platform/src/lesson-tool/embed-path", () => ({
	buildLessonToolEmbedPath: vi.fn(async () => null),
}));

vi.mock("./classroom-client", () => ({
	AcademyClassroomClient: (props: { initialLesson: { id: string } }) => (
		<div data-testid="classroom">{props.initialLesson.id}</div>
	),
}));

vi.mock("./onboarding-survey-modal", () => ({
	OnboardingSurveyModal: () => <div data-testid="survey" />,
}));

import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
import {
	getCachedPublishedCurriculum,
	getCachedPublishedLessonById,
} from "@startkiter/api/modules/course/lib/published-content-cache";
import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import LessonPage from "./page";

const learnerSession = {
	session: { id: "session-1", userId: "user-1" },
	user: { id: "user-1", email: "learner@example.com", role: "user" },
};

function publishedLesson(id: string, courseId = "course-1") {
	return {
		id,
		title: id,
		status: "PUBLISHED",
		isFreePreview: false,
		content: `# ${id}`,
		videoUrl: null,
		videoProvider: null,
		videoDuration: "10:00",
		aiContext: null,
		toolUrl: null,
		toolTitle: null,
		order: 1,
		chapter: { courseId },
	};
}

describe("LessonPage course access fan-out", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(learnerSession as never);
		vi.mocked(userCanAccessCourseId).mockResolvedValue(true);
		vi.mocked(db.courseOnboardingSurveyResponse.findUnique).mockResolvedValue({
			id: "survey-1",
		} as never);
		vi.mocked(getCachedPublishedCurriculum).mockResolvedValue([
			{
				id: "chapter-1",
				title: "第一章",
				courseId: "course-1",
				order: 1,
				course: {
					title: "開站包",
					watermarkSetting: null,
				},
				lessons: [
					{
						...publishedLesson("lesson-1"),
						chapter: undefined,
					},
					{
						...publishedLesson("lesson-2"),
						chapter: undefined,
					},
				],
			},
		] as never);
		vi.mocked(getCachedPublishedLessonById).mockImplementation(async (id: string) => {
			return publishedLesson(id) as never;
		});
		vi.mocked(db.lesson.findUnique).mockImplementation((async ({ where }: { where: { id?: unknown } }) => {
			const id = String(where?.id ?? "");
			return publishedLesson(id) as never;
		}) as unknown as typeof db.lesson.findUnique);
	});

	it("calls userCanAccessCourseId only once for the same courseId across multiple lessons", async () => {
		const element = await LessonPage({
			params: Promise.resolve({ lessonId: "lesson-1" }),
		});
		renderToStaticMarkup(element);

		expect(userCanAccessCourseId).toHaveBeenCalledTimes(1);
		expect(userCanAccessCourseId).toHaveBeenCalledWith("user-1", "course-1");
	});
});
