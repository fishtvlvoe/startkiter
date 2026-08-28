import type { CheckContext, CheckImplementation, CheckResult } from "../check-registry";

export const DEFAULT_HEARTBEAT_MAX_AGE_SECONDS = 300;

export type DeploymentHeartbeat = {
	receivedAt: Date;
};

export type DeploymentHeartbeatReader = {
	findLatestForUser: (userId: string) => Promise<DeploymentHeartbeat | null>;
};

const missingHeartbeatReader: DeploymentHeartbeatReader = {
	findLatestForUser: async () => null,
};

let heartbeatReader: DeploymentHeartbeatReader = missingHeartbeatReader;

export function setDeploymentHeartbeatReader(reader: DeploymentHeartbeatReader): void {
	heartbeatReader = reader;
}

function parseMaxAgeSeconds(params: Record<string, string>): number {
	const raw = params.max_age_seconds;
	if (!raw) {
		return DEFAULT_HEARTBEAT_MAX_AGE_SECONDS;
	}

	const parsed = Number(raw);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		return DEFAULT_HEARTBEAT_MAX_AGE_SECONDS;
	}

	return parsed;
}

export function createDeploymentHeartbeatFreshCheck(
	reader: DeploymentHeartbeatReader,
): CheckImplementation {
	return async (params: Record<string, string>, context: CheckContext): Promise<CheckResult> => {
		const heartbeat = await reader.findLatestForUser(context.userId);
		if (!heartbeat) {
			return { status: "pending" };
		}

		const ageMs = Date.now() - heartbeat.receivedAt.getTime();
		if (ageMs <= parseMaxAgeSeconds(params) * 1000) {
			return { status: "passed" };
		}

		return { status: "pending" };
	};
}

export const checkDeploymentHeartbeatFresh: CheckImplementation = (params, context) =>
	createDeploymentHeartbeatFreshCheck(heartbeatReader)(params, context);
