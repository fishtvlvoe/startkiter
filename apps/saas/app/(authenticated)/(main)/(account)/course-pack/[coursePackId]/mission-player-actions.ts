import type { CheckResult } from "@startkiter/course/src/course-pack/check-registry";
import type { Mission } from "@startkiter/course/src/course-pack/schema";

type FormValueInput = {
	coursePackMissionId: string;
	fieldKey: string;
	value: string;
};

type CheckInput = {
	coursePackMissionId: string;
	checkId: string;
	params: Record<string, string>;
};

export type MissionProcedureClient = {
	submitMissionFormValue: (input: FormValueInput) => Promise<{ success: boolean }>;
	runMissionCheck: (input: CheckInput) => Promise<CheckResult>;
};

export async function submitMissionValuesAndRunCheck({
	client,
	coursePackMissionId,
	values,
	evaluator,
}: {
	client: MissionProcedureClient;
	coursePackMissionId: string;
	values: Record<string, string>;
	evaluator: Mission["evaluator"];
}): Promise<CheckResult | null> {
	await Promise.all(
		Object.entries(values).map(([fieldKey, value]) =>
			client.submitMissionFormValue({ coursePackMissionId, fieldKey, value }),
		),
	);

	if (evaluator.type !== "external_check") {
		return null;
	}

	return client.runMissionCheck({
		coursePackMissionId,
		checkId: evaluator.check_id,
		params: evaluator.params,
	});
}
