import { describe, expect, it, vi } from "vitest";

import { checkDeploymentHeartbeatFresh } from "./checks/deployment-heartbeat-fresh";
import { checkRegistry, dispatchCheck, type CheckContext } from "./check-registry";

const context: CheckContext = {
	userId: "learner-1",
	coursePackMissionId: "mission-1",
	formValues: {},
};

describe("check-registry", () => {
	it("returns unknown_check_id for an unregistered check_id", async () => {
		await expect(dispatchCheck("not_a_real_check", {}, context)).resolves.toEqual({
			status: "failed",
			reasonCode: "unknown_check_id",
		});
	});

	it("dispatches a registered check_id to its implementation", async () => {
		const implementation = vi.fn().mockResolvedValue({ status: "passed" });

		await expect(
			dispatchCheck("custom_check", { foo: "bar" }, context, {
				custom_check: implementation,
			}),
		).resolves.toEqual({ status: "passed" });

		expect(implementation).toHaveBeenCalledWith({ foo: "bar" }, context);
	});

	it("does not register unknown names on the production registry", () => {
		expect(checkRegistry.not_a_real_check).toBeUndefined();
	});

	it("registers deployment_heartbeat_fresh", () => {
		expect(checkRegistry.deployment_heartbeat_fresh).toBe(checkDeploymentHeartbeatFresh);
	});
});
