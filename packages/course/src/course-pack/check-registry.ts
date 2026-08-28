import { checkBunnyZoneCreated } from "./checks/bunny-zone-created";
import { checkDeploymentHeartbeatFresh } from "./checks/deployment-heartbeat-fresh";

export type CheckContext = {
	userId: string;
	coursePackMissionId: string;
	formValues: Record<string, string>;
};

export type CheckResult =
	| { status: "passed"; detail?: string }
	| { status: "pending"; detail?: string }
	| {
			status: "failed";
			reasonCode: "auth_error" | "network_error" | "not_found" | "unknown_check_id";
			detail?: string;
	  };

export type CheckImplementation = (
	params: Record<string, string>,
	context: CheckContext,
) => Promise<CheckResult>;

export const checkRegistry: Record<string, CheckImplementation> = Object.assign(
	Object.create(null),
	{
		deployment_heartbeat_fresh: checkDeploymentHeartbeatFresh,
		bunny_zone_created: checkBunnyZoneCreated,
	},
);

export async function dispatchCheck(
	checkId: string,
	params: Record<string, string>,
	context: CheckContext,
	registry: Record<string, CheckImplementation> = checkRegistry,
): Promise<CheckResult> {
	if (!Object.hasOwn(registry, checkId)) {
		return { status: "failed", reasonCode: "unknown_check_id" };
	}

	return registry[checkId](params, context);
}
