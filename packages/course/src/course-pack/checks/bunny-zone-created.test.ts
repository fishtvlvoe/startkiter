import { describe, expect, it, vi } from "vitest";

import type { CheckContext } from "../check-registry";
import { createBunnyZoneCreatedCheck } from "./bunny-zone-created";

const context: CheckContext = {
	userId: "learner-1",
	coursePackMissionId: "mission-1",
	formValues: {},
};

describe("bunny_zone_created", () => {
	it("returns pending and makes no outbound call when the Bunny API key is missing", async () => {
		const fetchImpl = vi.fn();
		const check = createBunnyZoneCreatedCheck({ fetch: fetchImpl });

		await expect(check({}, context)).resolves.toEqual({ status: "pending" });
		expect(fetchImpl).not.toHaveBeenCalled();
	});
});
