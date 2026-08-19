import { describe, expect, it } from "vitest";

import { inspectMdxSource } from "./inspect-mdx-source";

describe("inspectMdxSource", () => {
	it("allows markdown plus allowlisted components", () => {
		const source = [
			"# 標題",
			"",
			"<InstantQuiz question=\"Q\" options={[\"A\",\"B\"]} answerIndex={1} explanation=\"E\" />",
		].join("\n");

		expect(inspectMdxSource(source)).toEqual({ ok: true });
	});

	it("rejects raw HTML", () => {
		expect(inspectMdxSource("<div>hi</div>")).toMatchObject({ ok: false });
	});

	it("rejects script tags", () => {
		expect(inspectMdxSource("<script>alert(1)</script>")).toMatchObject({ ok: false });
	});

	it("rejects unregistered components", () => {
		expect(inspectMdxSource("<EvilWidget />")).toEqual({
			ok: false,
			error: "講義內容含有未授權元件：EvilWidget",
		});
	});

	it("rejects import statements", () => {
		expect(inspectMdxSource('import x from "y"\n\n# hi')).toMatchObject({ ok: false });
	});
});
