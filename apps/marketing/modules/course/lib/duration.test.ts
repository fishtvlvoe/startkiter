import { describe, expect, it } from "vitest";

import { formatTotalDuration, parseDurationToSeconds } from "./duration";

describe("course duration helpers", () => {
	it("parses mm:ss and hh:mm:ss", () => {
		expect(parseDurationToSeconds("10:00")).toBe(600);
		expect(parseDurationToSeconds("01:02:03")).toBe(3723);
	});

	it("formats totals without hardcoded copy", () => {
		expect(formatTotalDuration(600)).toBe("10 分鐘");
		expect(formatTotalDuration(3723)).toBe("1 小時 2 分鐘");
	});
});
