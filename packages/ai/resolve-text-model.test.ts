import { beforeEach, describe, expect, it, vi } from "vitest";

const openaiMock = vi.hoisted(() =>
	vi.fn((modelId: string) => ({ provider: "openai.responses", modelId })),
);

vi.mock("@startkiter/database", () => ({
	db: {
		order: { findMany: vi.fn() },
		siteSetting: { findUnique: vi.fn(), upsert: vi.fn() },
	},
}));

vi.mock("@ai-sdk/openai", () => ({
	openai: openaiMock,
}));

import { db } from "@startkiter/database";

import { encryptSettingsJson } from "../api/modules/course/lib/settings-crypto";

describe("resolveTextModel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		process.env.SETTINGS_ENCRYPTION_KEY = "ai-provider-test-secret";
		openaiMock.mockImplementation((modelId: string) => ({
			provider: "openai.responses",
			modelId,
		}));
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue(null);
	});

	it("falls back to openai gpt-4o-mini when no configuration exists", async () => {
		const { resolveTextModel } = await import("./index");

		const model = await resolveTextModel();

		expect(model).toEqual({ provider: "openai.responses", modelId: "gpt-4o-mini" });
		expect(openaiMock).toHaveBeenCalledWith("gpt-4o-mini");
	});

	it("falls back to openai gpt-4o-mini without throwing when Gemini key decryption fails", async () => {
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue({
			id: "ai-provider-config",
			ciphertext: encryptSettingsJson(
				JSON.stringify({
					provider: "gemini",
					model: "gemini-1.5-flash",
					geminiApiKey: "secret-gemini-key",
				}),
				"original-secret",
			),
			updatedAt: new Date("2026-01-01T00:00:00.000Z"),
			updatedBy: null,
		} as never);
		process.env.SETTINGS_ENCRYPTION_KEY = "rotated-secret";

		const { resolveTextModel } = await import("./index");

		await expect(resolveTextModel()).resolves.toEqual({
			provider: "openai.responses",
			modelId: "gpt-4o-mini",
		});
	});

	it("falls back when Gemini is selected but the decrypted key is missing", async () => {
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue({
			id: "ai-provider-config",
			ciphertext: encryptSettingsJson(
				JSON.stringify({
					provider: "gemini",
					model: "gemini-1.5-flash",
				}),
				process.env.SETTINGS_ENCRYPTION_KEY!,
			),
			updatedAt: new Date("2026-01-01T00:00:00.000Z"),
			updatedBy: null,
		} as never);

		const { resolveTextModel } = await import("./index");

		await expect(resolveTextModel()).resolves.toEqual({
			provider: "openai.responses",
			modelId: "gpt-4o-mini",
		});
	});

	it("falls back when the stored model is not in the known allowlist", async () => {
		vi.mocked(db.siteSetting.findUnique).mockResolvedValue({
			id: "ai-provider-config",
			ciphertext: encryptSettingsJson(
				JSON.stringify({
					provider: "openai",
					model: "gpt-totally-fake",
				}),
				process.env.SETTINGS_ENCRYPTION_KEY!,
			),
			updatedAt: new Date("2026-01-01T00:00:00.000Z"),
			updatedBy: null,
		} as never);

		const { resolveTextModel } = await import("./index");

		await expect(resolveTextModel()).resolves.toEqual({
			provider: "openai.responses",
			modelId: "gpt-4o-mini",
		});
	});

	it("does not throw when the settings loader itself rejects", async () => {
		vi.mocked(db.siteSetting.findUnique).mockRejectedValue(new Error("db down"));
		const { resolveTextModel } = await import("./index");

		await expect(resolveTextModel()).resolves.toEqual({
			provider: "openai.responses",
			modelId: "gpt-4o-mini",
		});
	});
});
