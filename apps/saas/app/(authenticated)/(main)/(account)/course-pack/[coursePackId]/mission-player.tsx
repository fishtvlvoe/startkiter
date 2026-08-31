"use client";

import type { Mission } from "@startkiter/course/src/course-pack/schema";
import { MissionBlockRenderer, resolveMissionBlock } from "@startkiter/course/src/mdx/block-registry";
import { Button, Card } from "@startkiter/ui";
import { orpcClient } from "@shared/lib/orpc-client";
import { useState } from "react";

import { MissionCheckResult } from "./mission-check-result";
import { submitMissionValuesAndRunCheck } from "./mission-player-actions";
import type { LearnerMission } from "./mission-data";

type MissionState = {
	isSubmitting: boolean;
	submitted: boolean;
	error: string | null;
	result: Awaited<ReturnType<typeof submitMissionValuesAndRunCheck>>;
};

const emptyState: MissionState = {
	isSubmitting: false,
	submitted: false,
	error: null,
	result: null,
};

function getFormValues(form: HTMLFormElement): Record<string, string> {
	return Object.fromEntries(
		Array.from(new FormData(form).entries()).map(([key, value]) => [key, typeof value === "string" ? value : value.name]),
	);
}

export function CoursePackMissionPlayer({ missions }: { missions: LearnerMission[] }) {
	const [states, setStates] = useState<Record<string, MissionState>>({});

	function updateState(missionId: string, update: Partial<MissionState>) {
		setStates((current) => ({
			...current,
			[missionId]: { ...emptyState, ...current[missionId], ...update },
		}));
	}

	async function executeMission(mission: LearnerMission, values: Record<string, string>) {
		if (!mission.mission) return;

		updateState(mission.id, { isSubmitting: true, error: null });
		try {
			const result = await submitMissionValuesAndRunCheck({
				client: {
					submitMissionFormValue: (input) => orpcClient.course.submitMissionFormValue(input),
					runMissionCheck: (input) => orpcClient.course.runMissionCheck(input),
				},
				coursePackMissionId: mission.id,
				values,
				evaluator: mission.mission.evaluator,
			});
			updateState(mission.id, { isSubmitting: false, submitted: true, result });
		} catch {
			updateState(mission.id, {
				isSubmitting: false,
				error: "送出失敗，請確認資料後再試一次。",
			});
		}
	}

	return (
		<div className="space-y-6" data-testid="course-pack-mission-player">
			{missions.map((mission, index) => {
				const state = states[mission.id] ?? emptyState;
				const blockId = `mission-${mission.id}`;
				const resolution = mission.mission ? resolveMissionBlock(mission.mission.action, blockId) : null;

				return (
					<Card key={mission.id} className="p-6" data-testid="course-pack-mission" data-mission-id={mission.id}>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Mission {index + 1}</p>
							<h2 className="text-xl font-semibold">{mission.title}</h2>
							<p className="text-sm text-muted-foreground">{mission.goal}</p>
						</div>

						{!mission.mission ? (
							<p className="mt-6 text-sm text-red-700" role="alert">
								Mission 資料格式錯誤，無法載入。
							</p>
						) : !resolution?.ok ? (
							<p className="mt-6 text-sm text-red-700" role="alert">
								{resolution?.error ?? "Mission 區塊無法載入。"}
							</p>
						) : (
							<div className="mt-6 space-y-4">
								{mission.mission.action.surface === "structured_form" ? (
									<div
										onSubmit={(event) => {
											if (!(event.target instanceof HTMLFormElement)) return;
											event.preventDefault();
											void executeMission(mission, getFormValues(event.target));
										}}
									>
										<MissionBlockRenderer action={mission.mission.action} blockId={blockId} />
										<Button type="submit" className="mt-4" loading={state.isSubmitting}>
											送出並檢查
										</Button>
									</div>
								) : (
									<>
										<MissionBlockRenderer action={mission.mission.action} blockId={blockId} />
										{mission.mission.evaluator.type === "external_check" && (
											<Button
												type="button"
												onClick={() => void executeMission(mission, {})}
												loading={state.isSubmitting}
											>
												執行檢查
											</Button>
										)}
									</>
								)}

								{state.submitted && !state.result && <p className="text-sm text-emerald-700">資料已送出。</p>}
								{state.result && <MissionCheckResult result={state.result} />}
								{state.error && (
									<p className="text-sm text-red-700" role="alert">
										{state.error}
									</p>
								)}
								{mission.mission.evaluator.type === "external_check" && (
									<p className="text-xs text-muted-foreground">檢查項目：{mission.mission.evaluator.check_id}</p>
								)}
							</div>
						)}
					</Card>
				);
			})}
		</div>
	);
}
