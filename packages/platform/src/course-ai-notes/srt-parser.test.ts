import { srtToText } from "./srt-parser";
import { describe, expect, it } from "vitest";

describe("srtToText", () => {
	it("removes cue numbers and timestamps while preserving subtitle text", () => {
		const raw = `1
00:00:01,000 --> 00:00:03,500
Welcome to the course.

2
00:00:04,000 --> 00:00:06,000
This is the second line.
字幕內容。
`;

		expect(srtToText(raw)).toBe("Welcome to the course.\nThis is the second line.\n字幕內容。");
	});

	it("preserves multiline cues as separate text lines", () => {
		const raw = `1\n00:00:00,000 --> 00:00:02,000\nFirst line\nSecond line`;

		expect(srtToText(raw)).toBe("First line\nSecond line");
	});
});
