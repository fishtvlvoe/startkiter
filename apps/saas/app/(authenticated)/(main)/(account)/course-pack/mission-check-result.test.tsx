import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MissionCheckResult } from "./[coursePackId]/mission-check-result";

describe("Mission check result", () => {
	it.each([
		[{ status: "passed" as const }, "檢查通過"],
		[{ status: "pending" as const }, "尚未完成"],
		[{ status: "failed" as const, reasonCode: "auth_error" as const }, "驗證失敗"],
	])("顯示 %s 的學員可讀結果", (result, message) => {
		const html = renderToStaticMarkup(<MissionCheckResult result={result} />);

		expect(html).toContain(message);
	});
});
