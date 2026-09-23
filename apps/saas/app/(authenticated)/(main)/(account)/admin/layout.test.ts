import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const adminLayout = readFileSync(resolve(import.meta.dirname, "layout.tsx"), "utf8");
const accountSettingsLayout = readFileSync(
	resolve(import.meta.dirname, "../settings/layout.tsx"),
	"utf8",
);
const appWrapper = readFileSync(
	resolve(import.meta.dirname, "../../../../../modules/shared/components/AppWrapper.tsx"),
	"utf8",
);

describe("admin layout navigation surface", () => {
	it("does not mount the parallel SettingsMenu or its duplicated menu literals", () => {
		expect(adminLayout).not.toContain("SettingsMenu");
		expect(adminLayout).not.toContain("courseMenuItem");
		expect(adminLayout).not.toContain("coursePackMenuItem");
	});

	it("keeps SettingsMenu in the account settings layout", () => {
		expect(accountSettingsLayout).toContain("SettingsMenu");
	});

	it("keeps the admin content container fluid at a 390px mobile viewport", () => {
		const mobileViewportWidth = 390;
		const mainClass = appWrapper.match(/<main className="([^"]+)"/)?.[1] ?? "";
		const fixedWidths = [...mainClass.matchAll(/(?:^|\s)(?:md:)?w-\[(\d+)px\]/g)].map(([, width]) =>
			Number(width),
		);

		expect(mainClass).toContain("w-full");
		expect(mainClass).not.toContain("overflow-x");
		expect(fixedWidths.every((width) => width <= mobileViewportWidth)).toBe(true);
	});
});
