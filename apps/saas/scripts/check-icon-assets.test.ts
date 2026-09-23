import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const appRoot = resolve(import.meta.dirname, "..");
const scriptPath = resolve(appRoot, "scripts/check-icon-assets.mjs");
const missingDarkFixture = resolve(appRoot, "scripts/fixtures/icon-assets-missing-dark.json");
describe("icon asset check", () => {
	it("reports the icon id and missing dark variant", () => {
		const result = spawnSync(process.execPath, [scriptPath, missingDarkFixture], {
			cwd: appRoot,
			encoding: "utf8",
		});
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("nav.fixture:dark");
	});
});
