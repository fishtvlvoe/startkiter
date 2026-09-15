import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SignupForm.tsx", import.meta.url), "utf8");

describe("signup marketing consent", () => {
	it("exposes a consent checkbox that is unchecked by default and submits its value", () => {
		expect(source).toContain('id="marketing-consent"');
		expect(source).toContain("defaultChecked={false}");
		expect(source).toContain("marketingConsent");
	});
});
