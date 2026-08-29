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
	vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
	for (const root of roots) root.unmount();
	roots.clear();
	document.body.replaceChildren();
	vi.unstubAllGlobals();
});

describe("AiNotesDialog", () => {
	it("saves the instructor-edited draft content", async () => {
		const fetchMock = vi.mocked(fetch).mockResolvedValue(
			new Response(JSON.stringify({ success: true }), { status: 200 }),
		);
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

		expect(fetchMock).not.toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
