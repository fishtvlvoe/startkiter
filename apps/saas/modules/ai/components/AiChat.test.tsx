// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const streamMock = vi.fn();

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		ai: {
			stream: (...args: unknown[]) => streamMock(...args),
		},
	},
}));

import { AiChat } from "./AiChat";

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

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
	const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
	setValue?.call(textarea, value);
	textarea.dispatchEvent(new Event("input", { bubbles: true }));
	textarea.dispatchEvent(new Event("change", { bubbles: true }));
}

beforeEach(() => {
	vi.clearAllMocks();
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
	for (const root of roots) {
		root.unmount();
	}
	roots.clear();
	document.body.replaceChildren();
});

describe("AiChat", () => {
	it("submitting a message calls the /ai/stream procedure via orpcClient.ai.stream", async () => {
		streamMock.mockResolvedValue(
			(async function* () {
				yield { type: "start", messageId: "asst-1" };
				yield { type: "text-start", id: "t1" };
				yield { type: "text-delta", id: "t1", delta: "你好" };
				yield { type: "text-end", id: "t1" };
				yield { type: "finish" };
			})(),
		);

		const container = await render(<AiChat />);
		const textarea = container.querySelector<HTMLTextAreaElement>("textarea[name=message]");
		expect(textarea).not.toBeNull();

		await act(async () => {
			setTextareaValue(textarea!, "幫我說明 StartKiter");
		});

		await act(async () => {
			container.querySelector<HTMLFormElement>("form")?.requestSubmit();
		});

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(streamMock).toHaveBeenCalled();
		const [input] = streamMock.mock.calls[0] ?? [];
		expect(input).toEqual(
			expect.objectContaining({
				messages: expect.arrayContaining([
					expect.objectContaining({
						role: "user",
					}),
				]),
			}),
		);
	});

	it("renders streamed assistant text chunks in the message list", async () => {
		streamMock.mockResolvedValue(
			(async function* () {
				yield { type: "start", messageId: "asst-2" };
				yield { type: "text-start", id: "t2" };
				yield { type: "text-delta", id: "t2", delta: "串流" };
				yield { type: "text-delta", id: "t2", delta: "回覆片段" };
				yield { type: "text-end", id: "t2" };
				yield { type: "finish" };
			})(),
		);

		const container = await render(<AiChat />);
		const textarea = container.querySelector<HTMLTextAreaElement>("textarea[name=message]");

		await act(async () => {
			setTextareaValue(textarea!, "測試串流");
		});

		await act(async () => {
			container.querySelector<HTMLFormElement>("form")?.requestSubmit();
		});

		await vi.waitFor(() => {
			expect(container.textContent).toContain("串流回覆片段");
		});
	});

	it("shows a visible error state when the stream fails", async () => {
		streamMock.mockRejectedValue(new Error("OpenAI upstream failed"));

		const container = await render(<AiChat />);
		const textarea = container.querySelector<HTMLTextAreaElement>("textarea[name=message]");

		await act(async () => {
			setTextareaValue(textarea!, "會失敗的問題");
		});

		await act(async () => {
			container.querySelector<HTMLFormElement>("form")?.requestSubmit();
		});

		await vi.waitFor(() => {
			const errorNode = container.querySelector("[data-testid=ai-chat-error]");
			expect(errorNode).not.toBeNull();
			expect(errorNode?.textContent).toMatch(/失敗|錯誤|無法/);
		});
	});
});
