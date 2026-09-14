import { beforeEach, describe, expect, it, vi } from "vitest";

const openaiMock = vi.hoisted(() =>
	vi.fn((modelId: string) => ({ provider: "openai.responses", modelId })),
);

const loadAiProviderResolutionMock = vi.hoisted(() => vi.fn());

vi.mock("@startkiter/database", () => ({
	db: { order: { findMany: vi.fn() }, siteSetting: { findUnique: vi.fn() } },
}));

vi.mock("@ai-sdk/openai", () => ({
	openai: openaiMock,
}));

vi.mock("../api/modules/ai/lib/provider-settings", () => ({
	loadAiProviderResolution: loadAiProviderResolutionMock,
}));

describe("resolveTextModel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		openaiMock.mockImplementation((modelId: string) => ({
			provider: "openai.responses",
			modelId,
		}));
		loadAiProviderResolutionMock.mockResolvedValue(null);
	});

	it("falls back to openai gpt-4o-mini when no configuration exists", async () => {
		loadAiProviderResolutionMock.mockResolvedValue(null);
		const { resolveTextModel } = await import("./index");

		const model = await resolveTextModel();

		expect(model).toEqual({ provider: "openai.responses", modelId: "gpt-4o-mini" });
		expect(openaiMock).toHaveBeenCalledWith("gpt-4o-mini");
	});

	it("falls back to openai gpt-4o-mini without throwing when Gemini key decryption fails", async () => {
		// Decryption failure is surfaced as null from loadAiProviderResolution
		// (wrong SETTINGS_ENCRYPTION_KEY / corrupt ciphertext).
		loadAiProviderResolutionMock.mockResolvedValue(null);
		const { resolveTextModel } = await import("./index");

		await expect(resolveTextModel()).resolves.toEqual({
			provider: "openai.responses",
			modelId: "gpt-4o-mini",
		});
	});

	it("falls back when Gemini is selected but the decrypted key is missing", async () => {
		loadAiProviderResolutionMock.mockResolvedValue({
			provider: "gemini",
			model: "gemini-1.5-flash",
			geminiApiKey: null,
		});
		const { resolveTextModel } = await import("./index");

		await expect(resolveTextModel()).resolves.toEqual({
			provider: "openai.responses",
			modelId: "gpt-4o-mini",
		});
	});

	it("does not throw when the settings loader itself rejects", async () => {
		loadAiProviderResolutionMock.mockRejectedValue(new Error("db down"));
		const { resolveTextModel } = await import("./index");

		await expect(resolveTextModel()).resolves.toEqual({
			provider: "openai.responses",
			modelId: "gpt-4o-mini",
		});
	});
});
