import { describe, expect, it } from "vitest";

import { getTemplate } from "./templates";

describe("getTemplate", () => {
	it("renders template variables into html, text, and subject", async () => {
		const rendered = await getTemplate({
			templateId: "notification",
			locale: "zh-tw",
			context: {
				title: "作業已批改",
				message: "請回到課程查看回饋。",
				link: "https://app.startkiter.test/inbox",
			},
		});

		expect(rendered.subject).toBe("作業已批改");
		expect(rendered.html).toContain("作業已批改");
		expect(rendered.html).toContain("請回到課程查看回饋。");
		expect(rendered.html).toContain("https://app.startkiter.test/inbox");
		expect(rendered.text).toContain("作業已批改");
	});

	it("falls back to the catalog subject when the title variable is missing", async () => {
		const rendered = await getTemplate({
			templateId: "notification",
			locale: "zh-tw",
			context: {
				title: "",
				message: undefined,
			},
		});

		expect(rendered.subject).toBe("New notification");
		expect(rendered.html).not.toContain("請回到課程查看回饋。");
	});
});
