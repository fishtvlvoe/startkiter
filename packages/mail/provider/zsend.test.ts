import { afterEach, describe, expect, it, vi } from "vitest";

describe("ZSend provider", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it("POSTs to Zeabur ZSend endpoint with Bearer auth and string addresses", async () => {
		vi.stubEnv("ZSEND_API_KEY", "zs_test_key");

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ id: "zs_1" }),
			text: async () => "",
		});
		vi.stubGlobal("fetch", fetchMock);

		const { send } = await import("./zsend");
		await send({
			to: "learner@example.com",
			from: "noreply@example.com",
			subject: "Welcome",
			text: "Hello",
			html: "<p>Hello</p>",
			replyTo: "support@example.com",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.zeabur.com/api/v1/zsend/emails",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer zs_test_key",
					"Content-Type": "application/json",
				}),
			}),
		);

		const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
		expect(body).toMatchObject({
			from: "noreply@example.com",
			to: ["learner@example.com"],
			subject: "Welcome",
			text: "Hello",
			html: "<p>Hello</p>",
			replyTo: "support@example.com",
		});
	});

	it("throws an error containing the status code on non-2xx", async () => {
		vi.stubEnv("ZSEND_API_KEY", "zs_test_key");

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 503,
				text: async () => "unavailable",
			}),
		);

		const { send } = await import("./zsend");

		await expect(
			send({
				to: "learner@example.com",
				subject: "Hi",
				text: "Hi",
			}),
		).rejects.toThrow("Zeabur Email API error (503)");
	});
});
