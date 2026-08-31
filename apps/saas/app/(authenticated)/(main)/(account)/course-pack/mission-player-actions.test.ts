import { describe, expect, it, vi } from "vitest";

import { submitMissionValuesAndRunCheck } from "./[coursePackId]/mission-player-actions";

describe("CoursePack mission learner actions", () => {
	it("成功儲存所有欄位後執行 external check", async () => {
		const client = {
			submitMissionFormValue: vi.fn().mockResolvedValue({ success: true }),
			runMissionCheck: vi.fn().mockResolvedValue({ status: "passed", detail: "已完成" }),
		};

		await expect(
			submitMissionValuesAndRunCheck({
				client,
				coursePackMissionId: "mission-row-1",
				values: { bunnyApiKey: "secret", zoneName: "startkiter" },
				evaluator: {
					type: "external_check",
					check_id: "bunny_zone_created",
					params: { zone_name: "startkiter" },
					poll_interval_seconds: 1,
					timeout_seconds: 5,
				},
			}),
		).resolves.toEqual({ status: "passed", detail: "已完成" });

		expect(client.submitMissionFormValue).toHaveBeenCalledTimes(2);
		expect(client.submitMissionFormValue).toHaveBeenCalledWith({
			coursePackMissionId: "mission-row-1",
			fieldKey: "bunnyApiKey",
			value: "secret",
		});
		expect(client.runMissionCheck).toHaveBeenCalledWith({
			coursePackMissionId: "mission-row-1",
			checkId: "bunny_zone_created",
			params: { zone_name: "startkiter" },
		});
	});

	it("欄位儲存失敗時停止流程並保留錯誤", async () => {
		const client = {
			submitMissionFormValue: vi.fn().mockRejectedValue(new Error("network")),
			runMissionCheck: vi.fn(),
		};

		await expect(
			submitMissionValuesAndRunCheck({
				client,
				coursePackMissionId: "mission-row-1",
				values: { bunnyApiKey: "secret" },
				evaluator: { type: "deterministic", adapter: "manual", criteria: ["done"] },
			}),
		).rejects.toThrow("network");
		expect(client.runMissionCheck).not.toHaveBeenCalled();
	});
});
