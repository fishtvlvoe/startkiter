import { describe, expect, it } from "vitest";

import { config } from "./config";

describe("StartKiter payment plan catalog", () => {
	it("exposes exactly one one-time MVP offer", () => {
		expect(Object.keys(config.plans)).toEqual(["startkiter-mvp"]);

		const plan = config.plans["startkiter-mvp"];
		expect(plan).toHaveProperty("prices");
		if (!("prices" in plan)) {
			throw new Error("startkiter-mvp must be a paid plan");
		}

		expect(plan.prices).toHaveLength(1);
		expect(plan.prices[0]).toEqual({
			type: "one-time",
			amount: 8800,
			currency: "TWD",
		});
	});
});
