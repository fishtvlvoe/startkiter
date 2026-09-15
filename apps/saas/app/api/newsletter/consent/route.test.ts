import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/newsletter", () => ({
	recordMarketingConsent: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { recordMarketingConsent } from "@startkiter/newsletter";

import { POST } from "./route";

describe("POST /api/newsletter/consent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "user_1", email: "buyer@example.com" },
		} as never);
		vi.mocked(recordMarketingConsent).mockResolvedValue(undefined);
	});

	it("records marketing consent with source=register when granted", async () => {
		const response = await POST(
			new Request("http://localhost/api/newsletter/consent", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ source: "register", granted: true }),
			}),
		);

		expect(response.status).toBe(200);
		expect(recordMarketingConsent).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user_1",
				source: "register",
				granted: true,
			}),
		);
	});

	it("skips writing when granted is not true", async () => {
		const response = await POST(
			new Request("http://localhost/api/newsletter/consent", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ source: "checkout", granted: false }),
			}),
		);

		expect(response.status).toBe(200);
		expect(recordMarketingConsent).not.toHaveBeenCalled();
	});
});
