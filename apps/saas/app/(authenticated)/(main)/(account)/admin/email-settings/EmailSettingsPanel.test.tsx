// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateWelcomeEmailSettingsMock = vi.hoisted(() => vi.fn());
const sendWelcomeEmailTestMock = vi.hoisted(() => vi.fn());
const listEmailDeliveryLogMock = vi.hoisted(() => vi.fn());
const saveEmailSettingsActionMock = vi.hoisted(() => vi.fn());
const sendTestEmailActionMock = vi.hoisted(() => vi.fn());

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		course: {
			updateWelcomeEmailSettings: updateWelcomeEmailSettingsMock,
			sendWelcomeEmailTest: sendWelcomeEmailTestMock,
			listEmailDeliveryLog: listEmailDeliveryLogMock,
		},
	},
}));

vi.mock("./actions", () => ({
	saveEmailSettingsAction: saveEmailSettingsActionMock,
	sendTestEmailAction: sendTestEmailActionMock,
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

describe("EmailSettingsPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		listEmailDeliveryLogMock.mockResolvedValue({ logs: [] });
		saveEmailSettingsActionMock.mockResolvedValue({
			ok: true,
			summary: {
				provider: "tosend",
				hasTosendApiKey: true,
				tosendApiKeyHint: "••••••••1234",
			},
		});
		sendTestEmailActionMock.mockResolvedValue({ ok: true, provider: "tosend" });
	});

	afterEach(() => {
		for (const root of roots) root.unmount();
		roots.clear();
		document.body.replaceChildren();
	});

	describe("EmailSettingsPanel test send feedback (既有測試)", () => {
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

	describe("EmailSettingsPanel 新增功能測試 (Task 4.2)", () => {
		it("未設定顯示警示", async () => {
			const container = await render(<EmailSettingsPanel initialCourses={initialCourses} />);
			const status = container.querySelector('[data-testid="email-settings-status"]');

			expect(status).toBeTruthy();
			expect(status?.textContent).toContain("尚未完成設定：網站目前寄不出任何信。請選擇寄信服務並填入金鑰。");
		});

		it("已設定顯示生效 provider", async () => {
			const container = await render(
				<EmailSettingsPanel
					initialCourses={initialCourses}
					initialSettings={{
						provider: "tosend",
						hasTosendApiKey: true,
						tosendApiKeyHint: "••••••••1234",
						hasZsendApiKey: false,
						hasResendApiKey: false,
						hasSmtpPass: false,
					}}
				/>,
			);
			const status = container.querySelector('[data-testid="email-settings-status"]');

			expect(status).toBeTruthy();
			expect(status?.textContent).toContain("設定已生效，目前使用 ToSend 寄信。");
		});

		it("選 SMTP 只顯示 SMTP 欄位", async () => {
			const container = await render(<EmailSettingsPanel initialCourses={initialCourses} />);
			const smtpCard = container.querySelector('[data-testid="provider-smtp"]') as HTMLElement;
			expect(smtpCard).toBeTruthy();

			await act(async () => {
				smtpCard.click();
			});

			// 應該顯示 SMTP 專屬欄位
			expect(container.querySelector('[data-testid="fields-smtp"]')).toBeTruthy();
			expect(container.querySelector("#smtp-host")).toBeTruthy();
			expect(container.querySelector("#smtp-port")).toBeTruthy();
			expect(container.querySelector("#smtp-user")).toBeTruthy();
			expect(container.querySelector("#smtp-pass")).toBeTruthy();

			// 不應該顯示其他 provider 的欄位
			expect(container.querySelector('[data-testid="fields-tosend"]')).toBeNull();
			expect(container.querySelector('[data-testid="fields-zsend"]')).toBeNull();
			expect(container.querySelector('[data-testid="fields-resend"]')).toBeNull();
		});

		it("未儲存時測試按鈕停用", async () => {
			const container = await render(<EmailSettingsPanel initialCourses={initialCourses} />);
			const testBtn = container.querySelector("#service-send-test-btn") as HTMLButtonElement;

			expect(testBtn).toBeTruthy();
			expect(testBtn.disabled).toBe(true);

			// 點擊儲存後，測試按鈕應變為啟用
			const saveBtn = container.querySelector("#save-service-settings-btn") as HTMLButtonElement;
			await act(async () => {
				saveBtn.click();
			});

			expect(saveEmailSettingsActionMock).toHaveBeenCalled();
			expect(testBtn.disabled).toBe(false);
		});
	});

	describe("Email settings page layout 狀態條 Example 驗證", () => {
		it("① stored none / env none -> 顯示警告「尚未完成設定：網站目前寄不出任何信」", async () => {
			const container = await render(
				<EmailSettingsPanel
					initialCourses={initialCourses}
					initialSettings={{
						activeProvider: null,
						hasTosendApiKey: false,
						hasZsendApiKey: false,
						hasResendApiKey: false,
						hasSmtpPass: false,
					}}
				/>,
			);
			const status = container.querySelector('[data-testid="email-settings-status"]');
			expect(status?.textContent).toContain("尚未完成設定：網站目前寄不出任何信");
		});

		it("② stored none / env TOSEND_API_KEY set -> 顯示「目前使用 ToSend 寄信（來自主機設定）」", async () => {
			const container = await render(
				<EmailSettingsPanel
					initialCourses={initialCourses}
					initialSettings={{
						activeProvider: { name: "tosend", source: "environment" },
						hasTosendApiKey: false,
						hasZsendApiKey: false,
						hasResendApiKey: false,
						hasSmtpPass: false,
					}}
				/>,
			);
			const status = container.querySelector('[data-testid="email-settings-status"]');
			expect(status?.textContent).toContain("目前使用 ToSend 寄信（來自主機設定）");
		});

		it("③ stored tosend with tosendApiKey / env none -> 顯示「目前使用 ToSend 寄信」", async () => {
			const container = await render(
				<EmailSettingsPanel
					initialCourses={initialCourses}
					initialSettings={{
						provider: "tosend",
						hasTosendApiKey: true,
						activeProvider: { name: "tosend", source: "stored" },
						hasZsendApiKey: false,
						hasResendApiKey: false,
						hasSmtpPass: false,
					}}
				/>,
			);
			const status = container.querySelector('[data-testid="email-settings-status"]');
			expect(status?.textContent).toContain("目前使用 ToSend 寄信");
		});

		it("④ stored smtp without smtpHost / env none -> 顯示警告「尚未完成設定：網站目前寄不出任何信」", async () => {
			const container = await render(
				<EmailSettingsPanel
					initialCourses={initialCourses}
					initialSettings={{
						provider: "smtp",
						smtpHost: "",
						activeProvider: null,
						hasTosendApiKey: false,
						hasZsendApiKey: false,
						hasResendApiKey: false,
						hasSmtpPass: false,
					}}
				/>,
			);
			const status = container.querySelector('[data-testid="email-settings-status"]');
			expect(status?.textContent).toContain("尚未完成設定：網站目前寄不出任何信");
		});
	});
});
