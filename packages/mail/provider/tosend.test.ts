import { afterEach, describe, expect, it, vi } from "vitest";

describe("ToSend provider", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it("POSTs to TOSEND_API_BASE_URL/emails with Bearer auth and parsed addresses", async () => {
		vi.stubEnv("TOSEND_API_KEY", "ts_test_key");
		vi.stubEnv("TOSEND_API_BASE_URL", "https://api.tosend.test/v2");

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ message_id: "msg_1" }),
			text: async () => "",
		});
		vi.stubGlobal("fetch", fetchMock);

		const { send } = await import("./tosend");
		await send({
			to: "Learner <learner@example.com>",
			from: "StartKiter <noreply@example.com>",
			subject: "Welcome",
			text: "Hello",
			html: "<p>Hello</p>",
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.tosend.test/v2/emails",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer ts_test_key",
					"Content-Type": "application/json",
				}),
			}),
		);

		const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
		expect(body).toMatchObject({
			from: { name: "StartKiter", email: "noreply@example.com" },
			to: [{ name: "Learner", email: "learner@example.com" }],
			subject: "Welcome",
			text: "Hello",
			html: "<p>Hello</p>",
		});
	});

	it("defaults base URL to https://api.tosend.com/v2 when unset", async () => {
		vi.stubEnv("TOSEND_API_KEY", "ts_test_key");
		vi.stubEnv("TOSEND_API_BASE_URL", "");
		vi.stubEnv("MAIL_FROM", "noreply@example.com");

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({}),
			text: async () => "",
		});
		vi.stubGlobal("fetch", fetchMock);

		const { send } = await import("./tosend");
		await send({
			to: "learner@example.com",
			subject: "Hi",
			text: "Hi",
		});

		expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.tosend.com/v2/emails");
	});

	it("throws an error containing the status code on non-2xx", async () => {
		vi.stubEnv("TOSEND_API_KEY", "ts_test_key");
		vi.stubEnv("MAIL_FROM", "noreply@example.com");

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
				text: async () => "unauthorized",
			}),
		);

		const { send } = await import("./tosend");

		await expect(
			send({
				to: "learner@example.com",
				subject: "Hi",
				text: "Hi",
			}),
		).rejects.toThrow("ToSend API error (401)");
	});

	it("resolves on 2xx even when the response body has no message id", async () => {
		vi.stubEnv("TOSEND_API_KEY", "ts_test_key");
		vi.stubEnv("MAIL_FROM", "noreply@example.com");

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 202,
				json: async () => ({}),
				text: async () => "",
			}),
		);

		const { send } = await import("./tosend");

		await expect(
			send({
				to: "learner@example.com",
				subject: "Hi",
				text: "Hi",
			}),
		).resolves.toBeUndefined();
	});

	it("forwards AbortSignal to fetch and rejects when aborted while hung", async () => {
		vi.stubEnv("TOSEND_API_KEY", "ts_test_key");
		vi.stubEnv("MAIL_FROM", "noreply@example.com");

		const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
			return new Promise<Response>((_resolve, reject) => {
				const signal = init?.signal;
				if (!signal) {
					return;
				}
				if (signal.aborted) {
					reject(new DOMException("The operation was aborted.", "AbortError"));
					return;
				}
				signal.addEventListener(
					"abort",
					() => {
						reject(new DOMException("The operation was aborted.", "AbortError"));
					},
					{ once: true },
				);
			});
		});
		vi.stubGlobal("fetch", fetchMock);

		const { send } = await import("./tosend");
		const controller = new AbortController();
		const pending = send({
			to: "learner@example.com",
			subject: "Hi",
			text: "Hi",
			signal: controller.signal,
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);

		controller.abort();
		await expect(pending).rejects.toMatchObject({ name: "AbortError" });
		expect(controller.signal.aborted).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
