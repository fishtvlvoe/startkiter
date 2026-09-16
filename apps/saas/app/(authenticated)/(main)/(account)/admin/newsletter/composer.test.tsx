// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import NewsletterComposer from "./composer";

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

function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
	const prototype = input instanceof HTMLTextAreaElement
		? window.HTMLTextAreaElement.prototype
		: window.HTMLInputElement.prototype;
	const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
	setter?.call(input, value);
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("NewsletterComposer", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		for (const root of roots) root.unmount();
		roots.clear();
		document.body.replaceChildren();
	});

	it("autosaves the latest draft after the editor is idle", async () => {
		const autosave = vi.fn().mockResolvedValue({ ok: true });
		const container = await render(
			<NewsletterComposer
				campaign={{ id: "campaign-1", name: "草稿", type: "GENERAL", subject: "主旨", contentJson: { blocks: [] } }}
				recipientEstimate={42}
				onAutosave={autosave}
				onSendTest={vi.fn()}
				onSend={vi.fn()}
			/>,
		);
		const subject = container.querySelector("#newsletter-subject") as HTMLInputElement;

		await act(async () => {
			setInputValue(subject, "更新後主旨");
		});
		expect(autosave).not.toHaveBeenCalled();

		await act(async () => {
			vi.advanceTimersByTime(800);
		});
		expect(autosave).toHaveBeenCalledTimes(1);
		expect(autosave).toHaveBeenCalledWith(
			expect.objectContaining({ subject: "更新後主旨", campaignId: "campaign-1" }),
		);
	});

	it("shows the server rejection when a test recipient is not an internal account", async () => {
		const sendTest = vi.fn().mockResolvedValue({ ok: false, error: "測試信只能寄給內部帳號" });
		const container = await render(
			<NewsletterComposer
				campaign={{ id: "campaign-1", name: "草稿", type: "GENERAL", subject: "主旨", contentJson: { blocks: [] } }}
				recipientEstimate={42}
				onAutosave={vi.fn()}
				onSendTest={sendTest}
				onSend={vi.fn()}
			/>,
		);
		const recipient = container.querySelector("#newsletter-test-recipient") as HTMLInputElement;
		setInputValue(recipient, "buyer@example.com");

		await act(async () => {
			container.querySelector("#newsletter-send-test")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(sendTest).toHaveBeenCalledWith(expect.objectContaining({ recipient: "buyer@example.com" }));
		expect(container.textContent).toContain("測試信只能寄給內部帳號");
	});

	it("shows the recipient estimate and prevents a second confirmation submission", async () => {
		const send = vi.fn().mockResolvedValue({ ok: true });
		const container = await render(
			<NewsletterComposer
				campaign={{ id: "campaign-1", name: "草稿", type: "GENERAL", subject: "主旨", contentJson: { blocks: [] } }}
				recipientEstimate={42}
				onAutosave={vi.fn()}
				onSendTest={vi.fn()}
				onSend={send}
			/>,
		);

		await act(async () => {
			container.querySelector("#newsletter-send-campaign")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		expect(container.textContent).toContain("預估收件人數：42");

		const confirm = container.querySelector("#newsletter-confirm-send") as HTMLButtonElement;
		await act(async () => {
			confirm.click();
			confirm.click();
		});

		expect(send).toHaveBeenCalledTimes(1);
		expect(confirm.disabled).toBe(true);
	});

	it("schedules instead of sending when a future date is selected", async () => {
		const send = vi.fn();
		const schedule = vi.fn().mockResolvedValue({ ok: true });
		const container = await render(
			<NewsletterComposer
				campaign={{ id: "campaign-1", name: "草稿", type: "GENERAL", subject: "主旨", contentJson: { blocks: [] } }}
				recipientEstimate={42}
				onAutosave={vi.fn()}
				onSendTest={vi.fn()}
				onSend={send}
				onSchedule={schedule}
			/>,
		);

		await act(async () => {
			container.querySelector("#newsletter-send-campaign")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});
		const scheduledRadio = container.querySelector("#newsletter-send-mode-scheduled") as HTMLInputElement;
		scheduledRadio.click();
		const scheduledAt = container.querySelector("#newsletter-scheduled-at") as HTMLInputElement;
		setInputValue(scheduledAt, "2030-01-02T03:04");

		await act(async () => {
			container.querySelector("#newsletter-confirm-send")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(send).not.toHaveBeenCalled();
		expect(schedule).toHaveBeenCalledWith({ campaignId: "campaign-1", scheduledAt: new Date("2030-01-02T03:04").toISOString() });
	});

	it("keeps promotion fields that come from catalog bindings read-only", async () => {
		const container = await render(
			<NewsletterComposer
				campaign={{ id: "campaign-1", name: "促銷草稿", type: "PROMO", subject: "主旨", contentJson: { blocks: [] } }}
				recipientEstimate={0}
				onAutosave={vi.fn()}
				onSendTest={vi.fn()}
				onSend={vi.fn()}
			/>,
		);

		await act(async () => {
			container.querySelector("[data-testid='add-coupon']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
			container.querySelector("[data-testid='add-course']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect((container.querySelector("[aria-label='優惠券代碼']") as HTMLInputElement).readOnly).toBe(true);
		expect((container.querySelector("[aria-label='課程價格']") as HTMLInputElement).readOnly).toBe(true);
		expect((container.querySelector("[aria-label='課程網址']") as HTMLInputElement).readOnly).toBe(true);
	});
});
