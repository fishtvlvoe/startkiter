import { afterEach, describe, expect, it, vi } from "vitest";

import { send } from "./zsend";

describe("ZSend provider", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("posts a JSON payload with a recipient email array", async () => {
		vi.stubEnv("ZSEND_API_KEY", "zsend-key");
		const fetchMock = vi.fn().mockResolvedValue(new Response("accepted", { status: 201 }));
		vi.stubGlobal("fetch", fetchMock);

		await send({
			from: "sender@example.com",
			to: "learner@example.com",
			subject: "Welcome",
			text: "Welcome to StartKiter.",
			html: "<p>Welcome to StartKiter.</p>",
		});

		expect(fetchMock).toHaveBeenCalledWith("https://api.zeabur.com/api/v1/zsend/emails", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer zsend-key",
			},
			body: JSON.stringify({
				from: "sender@example.com",
				to: ["learner@example.com"],
				subject: "Welcome",
				text: "Welcome to StartKiter.",
				html: "<p>Welcome to StartKiter.</p>",
			}),
		});
	});

	it("throws the status code when the API returns a non-2xx response", async () => {
		vi.stubEnv("ZSEND_API_KEY", "zsend-key");
		const fetchMock = vi.fn().mockResolvedValue(new Response("service unavailable", { status: 503 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			send({
				from: "sender@example.com",
				to: "learner@example.com",
				subject: "Welcome",
				text: "Welcome.",
			}),
		).rejects.toThrow("ZSend API error (503): service unavailable");
	});
});
