import { beforeEach, describe, expect, it, vi } from "vitest";

const requireGlobalAdminMock = vi.hoisted(() => vi.fn());
const readAiProviderSettingsMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../../../../lib/admin-access", () => ({
	requireGlobalAdmin: requireGlobalAdminMock,
}));
vi.mock("@auth/lib/server", () => ({ getSession: vi.fn() }));
vi.mock("@startkiter/permissions", () => ({
	checkPermission: vi.fn(),
}));
vi.mock("@startkiter/api/modules/ai/lib/provider-settings", () => ({
	readAiProviderSettings: readAiProviderSettingsMock,
	writeAiProviderSettings: vi.fn(),
}));
vi.mock("@startkiter/ai", () => ({
	OPENAI_TEXT_MODEL_OPTIONS: ["gpt-4o-mini"],
	GEMINI_TEXT_MODEL_OPTIONS: ["gemini-1.5-flash"],
}));
vi.mock("@startkiter/ui", () => ({
	Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
		<div className={className}>{children}</div>
	),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
}));

import AiProviderSettingsPage from "./page";

describe("Admin AI provider settings page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		requireGlobalAdminMock.mockRejectedValue(new Error("REDIRECT:/"));
		readAiProviderSettingsMock.mockResolvedValue({
			provider: "openai",
			model: "gpt-4o-mini",
			hasGeminiKey: false,
		});
	});

	it("拒絕非 operator", async () => {
		await expect(
			AiProviderSettingsPage({ searchParams: Promise.resolve({}) }),
		).rejects.toThrow("REDIRECT:/");
		expect(readAiProviderSettingsMock).not.toHaveBeenCalled();
	});
});
