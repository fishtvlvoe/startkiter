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

	it("returns auth_error when Bunny responds with 401", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 }));
		const check = createBunnyZoneCreatedCheck({ fetch: fetchImpl });

		const result = await check({}, { ...context, formValues: { bunnyApiKey: "secret-bunny-key" } });

		expect(result).toEqual({
			status: "failed",
			reasonCode: "auth_error",
		});
		expect(JSON.stringify(result)).not.toContain("secret-bunny-key");
	});

	it("returns network_error when the Bunny request times out", async () => {
		const fetchImpl = vi.fn().mockRejectedValue(new DOMException("The operation was aborted.", "TimeoutError"));
		const check = createBunnyZoneCreatedCheck({ fetch: fetchImpl });

		await expect(
			check({}, { ...context, formValues: { bunnyApiKey: "secret-bunny-key" } }),
		).resolves.toEqual({
			status: "failed",
			reasonCode: "network_error",
		});
	});

	it("returns network_error when the Bunny request cannot reach the network", async () => {
		const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
		const check = createBunnyZoneCreatedCheck({ fetch: fetchImpl });

		await expect(
			check({}, { ...context, formValues: { bunnyApiKey: "secret-bunny-key" } }),
		).resolves.toEqual({
			status: "failed",
			reasonCode: "network_error",
		});
	});

	it("returns passed when Bunny lists an existing storage zone", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(
			new Response(JSON.stringify([{ Id: 1, Name: "learner-zone" }]), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);
		const check = createBunnyZoneCreatedCheck({ fetch: fetchImpl });

		await expect(
			check({}, { ...context, formValues: { bunnyApiKey: "secret-bunny-key" } }),
		).resolves.toEqual({ status: "passed" });
	});
});
