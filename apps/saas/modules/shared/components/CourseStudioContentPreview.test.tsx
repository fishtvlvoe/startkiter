// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { inspectMdxSource } = vi.hoisted(() => ({
	inspectMdxSource: vi.fn(),
}));

vi.mock("@startkiter/course", () => ({
	LessonMdx: ({ source }: { source: string }) => <div data-testid="lesson-mdx">{source}</div>,
	inspectMdxSource,
}));

import { CourseStudioContentPreview } from "./CourseStudioContentPreview";

const roots = new Set<Root>();

async function render(element: ReactElement) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	roots.add(root);

	await act(async () => {
		root.render(element);
	});

	return container;
}

beforeEach(() => {
	vi.useFakeTimers();
	inspectMdxSource.mockReset();
});

afterEach(() => {
	for (const root of roots) {
		root.unmount();
	}
	roots.clear();
	document.body.replaceChildren();
	vi.useRealTimers();
});

describe("CourseStudioContentPreview", () => {
	it("合法 MDX 內容在短暫延遲後顯示學員端一致的預覽", async () => {
		inspectMdxSource.mockReturnValue({ ok: true });
		const source = '<InstantQuiz blockId="quiz-01" question="1+1=?" />';
		const container = await render(<CourseStudioContentPreview source={source} />);

		expect(container.querySelector('[data-testid="lesson-mdx"]')).toBeNull();

		await act(async () => {
			vi.advanceTimersByTime(300);
		});

		expect(container.querySelector('[data-testid="lesson-mdx"]')?.textContent).toBe(source);
		expect(inspectMdxSource).toHaveBeenCalledWith(source);
	});

	it("未授權積木顯示與存檔相同的驗證錯誤", async () => {
		const error = "講義內容含有未授權元件：UnregisteredWidget";
		inspectMdxSource.mockReturnValue({ ok: false, error });
		const container = await render(
			<CourseStudioContentPreview source="<UnregisteredWidget />" />,
		);

		await act(async () => {
			vi.advanceTimersByTime(300);
		});

		expect(container.querySelector('[role="alert"]')?.textContent).toBe(error);
		expect(container.querySelector('[data-testid="lesson-mdx"]')).toBeNull();
	});
});
