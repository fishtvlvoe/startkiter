import { beforeEach, describe, expect, it, vi } from "vitest";

const { providerSend } = vi.hoisted(() => ({
	providerSend: vi.fn(),
}));

vi.mock("../provider", () => ({
	send: providerSend,
}));

vi.mock("@startkiter/logs", () => ({
	logger: { error: vi.fn(), log: vi.fn() },
}));

import { logger } from "@startkiter/logs";

import { sendEmail } from "./send";

describe("sendEmail", () => {
	beforeEach(() => {
		providerSend.mockReset();
		vi.mocked(logger.error).mockReset();
	});

	it("forwards subject/text/html to the mail provider and returns true", async () => {
		providerSend.mockResolvedValue(undefined);

		const ok = await sendEmail({
			to: "learner@example.com",
			subject: "Prod send",
			text: "Delivered by Resend.",
			html: "<p>Delivered by Resend.</p>",
		});

		expect(ok).toBe(true);
		expect(providerSend).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "learner@example.com",
				subject: "Prod send",
				text: "Delivered by Resend.",
				html: "<p>Delivered by Resend.</p>",
			}),
		);
	});

	it("returns false and invokes onError when the provider rejects", async () => {
		const rejection = new Error("RESEND_API_KEY is required");
		providerSend.mockRejectedValue(rejection);
		const onError = vi.fn();

		const ok = await sendEmail({
			to: "learner@example.com",
			subject: "Dev fallback",
			text: "Logged locally.",
			onError,
		});

		expect(ok).toBe(false);
		expect(onError).toHaveBeenCalledWith(rejection);
		expect(logger.error).toHaveBeenCalled();
	});

	it("returns false when required send fields are missing and the provider rejects", async () => {
		providerSend.mockRejectedValue(new Error("invalid payload"));

		const ok = await sendEmail({
			to: "",
			subject: "",
			text: "",
		} as never);

		expect(ok).toBe(false);
		expect(providerSend).toHaveBeenCalled();
	});

	it("forwards AbortSignal to the mail provider", async () => {
		providerSend.mockResolvedValue(undefined);
		const controller = new AbortController();

		const ok = await sendEmail({
			to: "learner@example.com",
			subject: "Abortable",
			text: "Body",
			signal: controller.signal,
		});

		expect(ok).toBe(true);
		expect(providerSend).toHaveBeenCalledWith(
			expect.objectContaining({
				signal: controller.signal,
			}),
		);
	});
});
