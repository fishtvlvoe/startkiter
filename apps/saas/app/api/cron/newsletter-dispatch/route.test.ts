import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/newsletter", () => ({
	runNewsletterDispatchTick: vi.fn(),
	dispatchCampaignBatch: vi.fn(),
	queueDueScheduledCampaigns: vi.fn(),
}));

import {
	queueDueScheduledCampaigns,
	runNewsletterDispatchTick,
} from "@startkiter/newsletter";

import { GET } from "./route";

describe("GET /api/cron/newsletter-dispatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("CRON_SECRET", "cron-secret");
		vi.mocked(runNewsletterDispatchTick).mockResolvedValue({
			queued: 1,
			dispatched: 1,
			sent: 2,
			skipped: 0,
			failed: 0,
			campaignIds: ["campaign-1"],
		});
		vi.mocked(queueDueScheduledCampaigns).mockResolvedValue({
			queued: 1,
			campaignIds: ["campaign-1"],
		});
	});

	it.each([undefined, "Bearer wrong", "Basic cron-secret"])(
		"rejects an invalid authorization header: %s",
		async (authorization) => {
			const response = await GET(
				new Request("http://localhost/api/cron/newsletter-dispatch", {
					headers: authorization ? { authorization } : undefined,
				}),
			);

			expect(response.status).toBe(401);
			expect(runNewsletterDispatchTick).not.toHaveBeenCalled();
		},
	);

	it("queues due campaigns and dispatches batches with a valid bearer token", async () => {
		const response = await GET(
			new Request("http://localhost/api/cron/newsletter-dispatch", {
				headers: { authorization: "Bearer cron-secret" },
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			queued: 1,
			dispatched: expect.any(Number),
		});
		expect(runNewsletterDispatchTick).toHaveBeenCalledOnce();
	});

	it("transitions a due SCHEDULED campaign to QUEUED only once when invoked twice near-simultaneously", async () => {
		let queued = false;

		vi.mocked(runNewsletterDispatchTick).mockImplementation(async () => {
			if (queued) {
				return {
					queued: 0,
					dispatched: 0,
					sent: 0,
					skipped: 0,
					failed: 0,
					campaignIds: [],
				};
			}

			queued = true;
			return {
				queued: 1,
				dispatched: 1,
				sent: 0,
				skipped: 0,
				failed: 0,
				campaignIds: ["campaign-1"],
			};
		});

		const request = () =>
			GET(
				new Request("http://localhost/api/cron/newsletter-dispatch", {
					headers: { authorization: "Bearer cron-secret" },
				}),
			);

		const [first, second] = await Promise.all([request(), request()]);
		const bodies = [await first.json(), await second.json()];
		const queuedTotal = bodies.reduce((sum, body) => sum + (body.queued as number), 0);

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect(queuedTotal).toBe(1);
		expect(runNewsletterDispatchTick).toHaveBeenCalledTimes(2);
	});
});
