// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateWelcomeEmailSettingsMock = vi.hoisted(() => vi.fn());
const sendWelcomeEmailTestMock = vi.hoisted(() => vi.fn());
const listEmailDeliveryLogMock = vi.hoisted(() => vi.fn());

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		course: {
			updateWelcomeEmailSettings: updateWelcomeEmailSettingsMock,
			sendWelcomeEmailTest: sendWelcomeEmailTestMock,
			listEmailDeliveryLog: listEmailDeliveryLogMock,
		},
	},
}));

vi.mock("next/dynamic", () => ({
	default: () =>
		function MockWelcomeEmailComposer(props: {
			value: unknown;
			onChange: (value: unknown) => void;
		}) {
			return (
				<div data-testid="welcome-email-composer">
					<button
						type="button"
						onClick={() =>
							props.onChange([
								{
									id: "p1",
									type: "paragraph",
									content: [{ type: "text", text: "edited", styles: {} }],
									children: [],
								},
							])
						}
					>
						mock-edit
					</button>
				</div>
			);
		},
}));

import EmailSettingsPanel from "./EmailSettingsPanel";

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

const initialCourses = [
	{
		id: "course-1",
		title: "開站包",
		welcomeEmail: {
			enabled: true,
			subjectTemplate: "歡迎 {{userName}} 加入 {{courseName}}",
			markdownTemplate: "舊 markdown",
			contentJson: null,
		},
	},
];

describe("EmailSettingsPanel test send feedback", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		listEmailDeliveryLogMock.mockResolvedValue({ logs: [] });
	});

	afterEach(() => {
		for (const root of roots) root.unmount();
		roots.clear();
		document.body.replaceChildren();
	});

	it("shows sending then success feedback and locks the button while sending", async () => {
		let resolveSend: (value: { ok: true; toEmail: string; subject: string }) => void = () => undefined;
		sendWelcomeEmailTestMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveSend = resolve;
				}),
		);

		const container = await render(<EmailSettingsPanel initialCourses={initialCourses} />);
		const emailInput = container.querySelector("#test-email") as HTMLInputElement;
		const sendButton = container.querySelector("#send-test-email") as HTMLButtonElement;

		await act(async () => {
			const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
			setter?.call(emailInput, "fish@example.com");
			emailInput.dispatchEvent(new Event("input", { bubbles: true }));
		});

		await act(async () => {
			sendButton.click();
		});

		expect(container.textContent).toContain("寄出中");
		expect(sendButton.disabled).toBe(true);

		await act(async () => {
			resolveSend({ ok: true, toEmail: "fish@example.com", subject: "歡迎 測試學員 加入 開站包" });
		});

		expect(container.textContent).toContain("已寄出測試信到 fish@example.com");
		expect(sendButton.disabled).toBe(false);
	});

	it("shows failure feedback when the provider rejects the send", async () => {
		sendWelcomeEmailTestMock.mockRejectedValue(new Error("Domain not found"));

		const container = await render(<EmailSettingsPanel initialCourses={initialCourses} />);
		const emailInput = container.querySelector("#test-email") as HTMLInputElement;
		const sendButton = container.querySelector("#send-test-email") as HTMLButtonElement;

		await act(async () => {
			const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
			setter?.call(emailInput, "fish@example.com");
			emailInput.dispatchEvent(new Event("input", { bubbles: true }));
		});

		await act(async () => {
			sendButton.click();
		});

		expect(container.textContent).toContain("沒有寄出：Domain not found");
		expect(sendButton.disabled).toBe(false);
	});

	it("blocks empty recipient client-side without sending a request", async () => {
		const container = await render(<EmailSettingsPanel initialCourses={initialCourses} />);
		const sendButton = container.querySelector("#send-test-email") as HTMLButtonElement;

		await act(async () => {
			sendButton.click();
		});

		expect(container.textContent).toContain("請輸入測試收件信箱");
		expect(sendWelcomeEmailTestMock).not.toHaveBeenCalled();
		expect(container.textContent).not.toContain("寄出中");
	});

	it("renders the WYSIWYG composer instead of a markdown textarea", async () => {
		const container = await render(<EmailSettingsPanel initialCourses={initialCourses} />);

		expect(container.querySelector('[data-testid="welcome-email-composer"]')).toBeTruthy();
		expect(container.querySelector("#email-markdown")).toBeNull();
	});
});
