// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AiNotesDialog } from "./AiNotesDialog";

const roots = new Set<Root>();

async function render(element: ReactElement) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	roots.add(root);
	await act(async () => root.render(element));
	return container;
}

beforeEach(() => {
	vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ configured: true }), { status: 200 })));
});

afterEach(() => {
	for (const root of roots) root.unmount();
	roots.clear();
	document.body.replaceChildren();
	vi.unstubAllGlobals();
});

describe("AiNotesDialog", () => {
	it("saves the instructor-edited draft content", async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ configured: true }), { status: 200 }));
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
		const container = await render(
			<AiNotesDialog
				open
				lessonId="lesson-1"
				lessonTitle="Lesson title"
				chapterTitle="Chapter title"
				initialDraft="# AI draft"
				onOpenChange={vi.fn()}
			/>,
		);

		const editor = container.querySelector<HTMLTextAreaElement>("textarea[name=content]");
		expect(editor).not.toBeNull();
		await act(async () => {
			if (!editor) throw new Error("editor not found");
			const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
			setValue?.call(editor, "# Instructor-edited draft");
			editor.dispatchEvent(new Event("input", { bubbles: true }));
			editor.dispatchEvent(new Event("change", { bubbles: true }));
		});
		await act(async () => {
			container.querySelector<HTMLButtonElement>("button[data-action=save]")?.click();
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/course/studio",
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining('"content":"# Instructor-edited draft"'),
			}),
		);
	});

	it("does not persist the lesson when the instructor cancels", async () => {
		const fetchMock = vi.mocked(fetch);
		const onOpenChange = vi.fn();
		const container = await render(
			<AiNotesDialog
				open
				lessonId="lesson-1"
				lessonTitle="Lesson title"
				chapterTitle="Chapter title"
				initialDraft="# AI draft"
				onOpenChange={onOpenChange}
			/>,
		);

		await act(async () => {
			container.querySelector<HTMLButtonElement>("button[data-action=cancel]")?.click();
		});

		expect(fetchMock).not.toHaveBeenCalledWith("/api/course/studio", expect.anything());
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("blocks subtitle generation when the instructor has no API key", async () => {
		const fetchMock = vi.mocked(fetch).mockResolvedValue(
			new Response(JSON.stringify({ configured: false }), { status: 200 }),
		);
		const container = await render(
			<AiNotesDialog open lessonId="lesson-1" lessonTitle="Lesson title" chapterTitle="Chapter title" onOpenChange={vi.fn()} />,
		);

		const input = container.querySelector<HTMLInputElement>("input[type=file]");
		expect(input?.disabled).toBe(true);
		expect(container.textContent).toContain("請先設定 API Key");
		await act(async () => {
			if (!input) throw new Error("file input not found");
			Object.defineProperty(input, "files", { value: [{ text: async () => "subtitle" }] });
			input.dispatchEvent(new Event("change", { bubbles: true }));
		});
		expect(fetchMock).not.toHaveBeenCalledWith("/api/course/ai-notes/generate", expect.anything());
	});

	it("shows rate-limit and empty-stream failures instead of completion", async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ configured: true }), { status: 200 }));
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "RATE_LIMITED" }), { status: 429 }));
		const container = await render(
			<AiNotesDialog open lessonId="lesson-1" lessonTitle="Lesson title" chapterTitle="Chapter title" onOpenChange={vi.fn()} />,
		);
		const input = container.querySelector<HTMLInputElement>("input[type=file]");
		await act(async () => {
			if (!input) throw new Error("file input not found");
			Object.defineProperty(input, "files", { value: [{ text: async () => "subtitle" }] });
			input.dispatchEvent(new Event("change", { bubbles: true }));
		});
		expect(container.textContent).toContain("呼叫太頻繁，請稍後再試");

		fetchMock.mockResolvedValueOnce(new Response(new ReadableStream({ start: (controller) => controller.close() }), { status: 200 }));
		await act(async () => {
			input?.dispatchEvent(new Event("change", { bubbles: true }));
			await new Promise((resolve) => setTimeout(resolve, 20));
		});
		expect(container.textContent).toContain("生成失敗：沒有收到內容");
	});
});
