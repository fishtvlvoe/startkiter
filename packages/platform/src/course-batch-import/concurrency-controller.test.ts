import { describe, expect, it } from "vitest";

import { runWithConcurrency } from "./concurrency-controller";

describe("runWithConcurrency", () => {
	it("never runs more tasks than the configured limit", async () => {
		let running = 0;
		let maximum = 0;

		const results = await runWithConcurrency(
			Array.from({ length: 10 }, (_, index) => index),
			1,
			async (index) => {
				running += 1;
				maximum = Math.max(maximum, running);
				await new Promise((resolve) => setTimeout(resolve, 1));
				running -= 1;
				return index * 2;
			},
		);

		expect(maximum).toBe(1);
		expect(results).toEqual(Array.from({ length: 10 }, (_, index) => index * 2));
	});

	it("supports the five-request AI generation limit", async () => {
		let maximum = 0;
		let running = 0;
		await runWithConcurrency(Array.from({ length: 10 }), 5, async () => {
			running += 1;
			maximum = Math.max(maximum, running);
			await new Promise((resolve) => setTimeout(resolve, 1));
			running -= 1;
		});
		expect(maximum).toBe(5);
	});
});
