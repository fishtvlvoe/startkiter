import { afterEach, describe, expect, it, vi } from "vitest";

import { send } from "./tosend";

describe("ToSend provider", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("posts parsed sender and recipient addresses to the configured endpoint", async () => {
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		vi.stubEnv("TOSEND_API_BASE_URL", "https://mail.example.test/v2/");
		const fetchMock = vi.fn().mockResolvedValue(new Response("not-json", { status: 202 }));
		vi.stubGlobal("fetch", fetchMock);

		await send({
			from: '"StartKiter" <sender@example.com>',
			to: "Learner <learner@example.com>",
			cc: ["Support <support@example.com>", "audit@example.com"],
			bcc: ["Archive <archive@example.com>"],
			replyTo: "reply@example.com",
			subject: "Welcome",
			text: "Welcome to StartKiter.",
			html: "<p>Welcome to StartKiter.</p>",
		});

		expect(fetchMock).toHaveBeenCalledWith("https://mail.example.test/v2/emails", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer tosend-key",
			},
			body: JSON.stringify({
				from: { name: "StartKiter", email: "sender@example.com" },
				to: [{ name: "Learner", email: "learner@example.com" }],
				cc: [
					{ name: "Support", email: "support@example.com" },
					{ email: "audit@example.com" },
				],
				bcc: [{ name: "Archive", email: "archive@example.com" }],
				replyTo: "reply@example.com",
				subject: "Welcome",
				text: "Welcome to StartKiter.",
				html: "<p>Welcome to StartKiter.</p>",
			}),
		});
	});

	it("uses the default API base URL and resolves for any 2xx response body", async () => {
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			send({
				from: "sender@example.com",
				to: "learner@example.com",
				subject: "Welcome",
				text: "Welcome.",
			}),
		).resolves.toBeUndefined();

		expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.tosend.com/v2/emails");
	});

	it("uses TOSEND_FROM_EMAIL when the caller does not provide a sender", async () => {
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		vi.stubEnv("TOSEND_FROM_EMAIL", "StartKiter <noreply@example.com>");
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
		vi.stubGlobal("fetch", fetchMock);

		await send({
			to: "learner@example.com",
			subject: "Welcome",
			text: "Welcome.",
		});

		const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
		expect(JSON.parse(request.body as string).from).toEqual({
			name: "StartKiter",
			email: "noreply@example.com",
		});
	});

	it("throws the status code when the API returns a non-2xx response", async () => {
		vi.stubEnv("TOSEND_API_KEY", "tosend-key");
		const fetchMock = vi.fn().mockResolvedValue(new Response("quota exceeded", { status: 429 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			send({
				from: "sender@example.com",
				to: "learner@example.com",
				subject: "Welcome",
				text: "Welcome.",
			}),
		).rejects.toThrow("ToSend API error (429): quota exceeded");
	});
});
