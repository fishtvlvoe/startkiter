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

export const checkRegistry: Record<string, CheckImplementation> = {
	deployment_heartbeat_fresh: checkDeploymentHeartbeatFresh,
};

export async function dispatchCheck(
	checkId: string,
	params: Record<string, string>,
	context: CheckContext,
	registry: Record<string, CheckImplementation> = checkRegistry,
): Promise<CheckResult> {
	const implementation = registry[checkId];
	if (!implementation) {
		return { status: "failed", reasonCode: "unknown_check_id" };
	}

	return implementation(params, context);
}
