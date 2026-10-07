import { beforeEach, describe, expect, it, vi } from "vitest";

const requireGlobalAdminMock = vi.hoisted(() => vi.fn());
const saveEmailSettingsMock = vi.hoisted(() => vi.fn());
const sendTestEmailMock = vi.hoisted(() => vi.fn());
const getEmailSettingsSummaryMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../../../lib/admin-access", () => ({
	requireGlobalAdmin: requireGlobalAdminMock,
}));

vi.mock("@startkiter/mail", () => ({
	saveEmailSettings: saveEmailSettingsMock,
	sendTestEmail: sendTestEmailMock,
	getEmailSettingsSummary: getEmailSettingsSummaryMock,
}));

import {
	getEmailSettingsSummaryAction,
	saveEmailSettingsAction,
	sendTestEmailAction,
} from "./actions";

describe("Email Settings Server Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("權限檢查（requireGlobalAdmin）", () => {
		it("當非管理員時，saveEmailSettingsAction 被擋下", async () => {
			requireGlobalAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT: /login"));

			await expect(
				saveEmailSettingsAction({ provider: "tosend", tosendApiKey: "tsend_secret_123" }),
			).rejects.toThrow("NEXT_REDIRECT: /login");

			expect(saveEmailSettingsMock).not.toHaveBeenCalled();
		});

		it("當非管理員時，sendTestEmailAction 被擋下", async () => {
			requireGlobalAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT: /"));

			await expect(sendTestEmailAction("fish@example.com")).rejects.toThrow(
				"NEXT_REDIRECT: /",
			);

			expect(sendTestEmailMock).not.toHaveBeenCalled();
		});

		it("當非管理員時，getEmailSettingsSummaryAction 被擋下", async () => {
			requireGlobalAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT: /login"));

			await expect(getEmailSettingsSummaryAction()).rejects.toThrow(
				"NEXT_REDIRECT: /login",
			);

			expect(getEmailSettingsSummaryMock).not.toHaveBeenCalled();
		});
	});

	describe("管理員操作與敏感資訊遮罩", () => {
		it("saveEmailSettingsAction 成功時回傳 summary 且絕對不含明碼金鑰", async () => {
			requireGlobalAdminMock.mockResolvedValue({ user: { id: "admin-user-1" } });
			saveEmailSettingsMock.mockResolvedValue({ ok: true });
			getEmailSettingsSummaryMock.mockResolvedValue({
				provider: "tosend",
				hasTosendApiKey: true,
				tosendApiKeyHint: "••••••••1234",
				hasZsendApiKey: false,
				hasResendApiKey: false,
				hasSmtpPass: false,
			});

			const plainSecret = "tsend_super_secret_plain_key_1234";
			const result = await saveEmailSettingsAction({
				provider: "tosend",
				tosendApiKey: plainSecret,
			});

			expect(saveEmailSettingsMock).toHaveBeenCalledWith(
				{ provider: "tosend", tosendApiKey: plainSecret },
				"admin-user-1",
			);
			expect(result.ok).toBe(true);

			if (result.ok) {
				const serialized = JSON.stringify(result);
				// 驗證回傳的 JSON 絕不含明碼金鑰
				expect(serialized).not.toContain(plainSecret);
				expect(result.summary.hasTosendApiKey).toBe(true);
				expect(result.summary.tosendApiKeyHint).toBe("••••••••1234");
				expect((result.summary as Record<string, unknown>).tosendApiKey).toBeUndefined();
			}
		});

		it("saveEmailSettingsAction 失敗時回傳錯誤訊息", async () => {
			requireGlobalAdminMock.mockResolvedValue({ user: { id: "admin-user-1" } });
			saveEmailSettingsMock.mockResolvedValue({ ok: false, error: "invalid_input" });

			const result = await saveEmailSettingsAction({
				fromEmail: "invalid-email",
			});

			expect(result).toEqual({ ok: false, error: "invalid_input" });
			expect(getEmailSettingsSummaryMock).not.toHaveBeenCalled();
		});

		it("sendTestEmailAction 成功呼叫底層 sendTestEmail", async () => {
			requireGlobalAdminMock.mockResolvedValue({ user: { id: "admin-user-1" } });
			sendTestEmailMock.mockResolvedValue({ ok: true, provider: "tosend" });

			const result = await sendTestEmailAction("fish@example.com");

			expect(sendTestEmailMock).toHaveBeenCalledWith("fish@example.com");
			expect(result).toEqual({ ok: true, provider: "tosend" });
		});

		it("getEmailSettingsSummaryAction 成功回傳 summary", async () => {
			requireGlobalAdminMock.mockResolvedValue({ user: { id: "admin-user-1" } });
			const summaryData = {
				provider: "resend",
				hasResendApiKey: true,
				resendApiKeyHint: "••••••••5678",
				hasTosendApiKey: false,
				hasZsendApiKey: false,
				hasSmtpPass: false,
			};
			getEmailSettingsSummaryMock.mockResolvedValue(summaryData);

			const result = await getEmailSettingsSummaryAction();

			expect(getEmailSettingsSummaryMock).toHaveBeenCalled();
			expect(result).toEqual(summaryData);
		});
	});
});
