import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const localDirectory = resolve(currentDirectory, "components");
const officialDirectory = resolve(
	currentDirectory,
	"../../../vendor/supastarter-nextjs/packages/ui/components",
);

const readComponent = (directory: string, name: string) =>
	readFileSync(resolve(directory, `${name}.tsx`), "utf8");

const removePreservedDataSlots = (source: string) =>
	source
		.replace(/\sdata-slot="[^"]+"/g, "")
		.replace(/\n\s*"data-slot"\?: string;/g, "")
		.replace(/\n\s*"data-slot": "[^"]+",/g, "");

describe("official Base UI component source parity", () => {
	it.each(["button", "card", "badge"])(
	"keeps %s aligned with the official implementation while preserving data-slot",
		(name) => {
			const localSource = readComponent(localDirectory, name);
			const officialSource = readComponent(officialDirectory, name);

			expect(localSource).not.toMatch(/from ["']radix-ui["']/);
			expect(removePreservedDataSlots(localSource)).toBe(officialSource);
		},
	);

	it("uses the official Button render prop instead of the Radix Slot API", () => {
		const source = readComponent(localDirectory, "button");

		expect(source).toContain("render?:");
		expect(source).not.toContain("asChild");
		expect(source).not.toContain("SlotPrimitive");
	});
});
