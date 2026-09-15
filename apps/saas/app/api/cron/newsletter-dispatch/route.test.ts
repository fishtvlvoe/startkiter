import { beforeEach, describe, expect, it, vi } from "vitest";

const { dispatchNewsletters, queueDueCampaigns } = vi.hoisted(() => ({
	dispatchNewsletters: vi.fn(),
	queueDueCampaigns: vi.fn(),
}));

vi.mock("@startkiter/newsletter", () => ({
	dispatchNewsletters,
	queueDueCampaigns,
}));

describe("GET /api/cron/newsletter-dispatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		vi.stubEnv("CRON_SECRET", "cron-secret");
		queueDueCampaigns.mockResolvedValue({ queued: 1 });
		dispatchNewsletters.mockResolvedValue({ queued: 1, processed: 0 });
	});

	it.each([undefined, "Bearer wrong", "Basic cron-secret"])(
		"rejects an invalid authorization header: %s",
		async (authorization) => {
			const { GET } = await import("./route");
			const response = await GET(
				new Request("http://localhost/api/cron/newsletter-dispatch", {
					headers: authorization ? { authorization } : undefined,
				}),
			);

			expect(response.status).toBe(401);
			expect(dispatchNewsletters).not.toHaveBeenCalled();
			expect(queueDueCampaigns).not.toHaveBeenCalled();
		},
	);

	it("runs dispatch with a valid bearer token", async () => {
		const { GET } = await import("./route");
		const response = await GET(
			new Request("http://localhost/api/cron/newsletter-dispatch", {
				headers: { authorization: "Bearer cron-secret" },
			}),
		);

		expect(response.status).toBe(200);
		expect(dispatchNewsletters).toHaveBeenCalledOnce();
		expect(await response.json()).toEqual({ queued: 1, processed: 0 });
	});

	it("near-simultaneous cron triggers only queue a due campaign once (atomic scheduling)", async () => {
		let queued = false;
		queueDueCampaigns.mockImplementation(async () => {
			if (queued) return { queued: 0 };
			queued = true;
			return { queued: 1 };
		});
		dispatchNewsletters.mockImplementation(async () => {
			const result = await queueDueCampaigns();
			return { queued: result.queued, processed: 0 };
		});

		const { GET } = await import("./route");
		const request = () =>
			GET(
				new Request("http://localhost/api/cron/newsletter-dispatch", {
					headers: { authorization: "Bearer cron-secret" },
				}),
			);

		const [a, b] = await Promise.all([request(), request()]);
		expect(a.status).toBe(200);
		expect(b.status).toBe(200);

		const bodies = await Promise.all([a.json(), b.json()]);
		expect(bodies.reduce((sum, body) => sum + body.queued, 0)).toBe(1);
		expect(queueDueCampaigns).toHaveBeenCalledTimes(2);
	});
});
