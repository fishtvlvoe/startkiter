// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BatchImportDialog } from "./BatchImportDialog";

const roots = new Set<Root>();

async function render(element: ReactElement) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	roots.add(root);
	await act(async () => root.render(element));
	return container;
}

afterEach(() => {
	for (const root of roots) root.unmount();
	roots.clear();
	document.body.replaceChildren();
	vi.unstubAllGlobals();
});

describe("BatchImportDialog", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	it("keeps the dialog open and lists failed lessons for a partial import", async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ bunnyVideoId: "video-1", duration: 10 }), { status: 200 }));
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ failures: [{ lessonTitle: "Lesson 1" }] }), { status: 207 }));
		const onClose = vi.fn();
		const container = await render(<BatchImportDialog courseId="course-1" onClose={onClose} />);
		const input = container.querySelector<HTMLInputElement>("#batch-import-folder");
		if (!input) throw new Error("folder input not found");
		const video = Object.assign(new File(["video"], "video.mp4"), { webkitRelativePath: "Course/Chapter/Lesson/video.mp4" });
		const notes = Object.assign(new File(["# Notes"], "notes.md"), { webkitRelativePath: "Course/Chapter/Lesson/notes.md" });
		const files = { 0: video, 1: notes, length: 2, item: (index: number) => [video, notes][index] ?? null };
		Object.defineProperty(input, "files", { value: files });
		await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
		const button = (label: string) => [...container.querySelectorAll("button")].find((item) => item.textContent?.trim() === label);
		await act(async () => button("開始處理")?.click());
		await act(async () => button("確認匯入")?.click());

		expect(container.textContent).toContain("1 個單元建立失敗：Lesson 1");
		expect(onClose).not.toHaveBeenCalled();
	});
});
