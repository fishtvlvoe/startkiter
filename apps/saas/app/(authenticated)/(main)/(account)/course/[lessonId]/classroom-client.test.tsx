// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/course", () => ({
	extractLessonBlockIds: (source: string) => {
		const matches = source.match(/blockId="([^"]+)"/g) ?? [];
		return matches.map((m) => m.replace(/blockId="([^"]+)"/, "$1"));
	},
	FluentPlayer: () => null,
	LessonMdx: () => null,
}));
vi.mock("./lesson-comments-panel", () => ({ LessonCommentsPanel: () => null }));
vi.mock("./lesson-messages-panel", () => ({ LessonMessagesPanel: () => null }));
vi.mock("./lesson-tool-embed", () => ({ LessonToolEmbed: () => null }));

const getLearnerCurriculumMock = vi.hoisted(() => vi.fn());
const toggleLessonProgressMock = vi.hoisted(() => vi.fn());
const recordWatchTimeMock = vi.hoisted(() => vi.fn());

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		course: {
			getLearnerCurriculum: getLearnerCurriculumMock,
			toggleLessonProgress: toggleLessonProgressMock,
			recordWatchTime: recordWatchTimeMock,
		},
	},
}));

import { AcademyClassroomClient } from "./classroom-client";

const roots = new Set<Root>();

async function render(element: ReactElement) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	roots.add(root);
	await act(async () => root.render(element));
	return container;
}

function baseLesson(overrides: Partial<Parameters<typeof AcademyClassroomClient>[0]["initialLesson"]> = {}) {
	return {
		id: "lesson-plain",
		title: "Plain lesson",
		duration: "5:00",
		isFreePreview: false,
		videoUrl: "",
		content: "# Pure Text Lesson\n\nJust plain text, no interactive blocks.",
		aiContext: "",
		courseTitle: "Course",
		watermarkSetting: null,
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	getLearnerCurriculumMock.mockResolvedValue({
		progress: { completedLessonIds: [] },
	});
	toggleLessonProgressMock.mockResolvedValue({ completed: true });
});

afterEach(() => {
	for (const root of roots) root.unmount();
	roots.clear();
	document.body.replaceChildren();
});

function renderClassroom(lesson: ReturnType<typeof baseLesson>) {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(
		<QueryClientProvider client={queryClient}>
			<AcademyClassroomClient
				initialLesson={lesson}
				curriculum={[{ id: "chapter-1", title: "Chapter 1", lessons: [lesson] }]}
				viewerEmail="learner@example.com"
			/>
		</QueryClientProvider>,
	);
}

describe("classroom-client toggleCompletion (real component, real click)", () => {
	it("marks a lesson with no interactive blocks complete without a blockId", async () => {
		const container = await renderClassroom(baseLesson());

		const button = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("標記為完成"),
		);
		expect(button).toBeDefined();

		await act(async () => {
			button?.click();
		});
		// mutation is async; flush a microtask tick
		await act(async () => {
			await Promise.resolve();
		});

		expect(toggleLessonProgressMock.mock.calls[0]?.[0]).toEqual({
			lessonId: "lesson-plain",
			blockId: undefined,
		});
	});

	it("marks a lesson with interactive blocks complete using the real blockId", async () => {
		const lesson = baseLesson({
			id: "lesson-with-block",
			content: '# Lesson\n\n<InstantQuiz blockId="quiz-01" />',
		});
		const container = await renderClassroom(lesson);

		const button = Array.from(container.querySelectorAll("button")).find((b) =>
			b.textContent?.includes("標記為完成"),
		);
		await act(async () => {
			button?.click();
		});
		await act(async () => {
			await Promise.resolve();
		});

		expect(toggleLessonProgressMock.mock.calls[0]?.[0]).toEqual({
			lessonId: "lesson-with-block",
			blockId: "quiz-01",
		});
	});
});
