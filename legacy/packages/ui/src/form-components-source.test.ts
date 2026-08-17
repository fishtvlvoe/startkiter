import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const localDirectory = resolve(sourceDirectory, "components");
const officialDirectory = resolve(
	sourceDirectory,
	"../../../vendor/supastarter-nextjs/packages/ui/components",
);

const readComponent = (directory: string, name: string) =>
	readFileSync(resolve(directory, `${name}.tsx`), "utf8");

const removeInputDataSlot = (source: string) => source.replace(/\n\s*data-slot="input"/g, "");

describe("official form component source parity", () => {
	it("keeps Input aligned with the official implementation", () => {
		const localSource = readComponent(localDirectory, "input");
		const officialSource = readComponent(officialDirectory, "input");

		expect(localSource).not.toMatch(/from ["']radix-ui["']/);
		expect(removeInputDataSlot(localSource)).toBe(officialSource);
	});

	it("keeps Label as the official native label primitive", () => {
		const localSource = readComponent(localDirectory, "label");
		const officialSource = readComponent(officialDirectory, "label");

		expect(localSource).not.toMatch(/from ["']radix-ui["']/);
		expect(localSource).not.toContain("LabelPrimitive");
		expect(localSource).toBe(officialSource);
	});

	it("keeps FormProvider composition without Radix Slot or Label primitives", () => {
		const source = readComponent(localDirectory, "form");

		expect(source).toContain("FormProvider");
		expect(source).not.toMatch(/from ["']radix-ui["']/);
		expect(source).not.toContain("SlotPrimitive");
		expect(source).not.toContain("LabelPrimitive");
	});
});
