import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { scanWorkspaceCopy } from "./forbidden-nouns-check";

describe("workspace visible copy static check", () => {
	it("does not expose legacy role nouns in UI modules or the UX demo", () => {
		expect(() => scanWorkspaceCopy(resolve(import.meta.dirname, "../../../.."))).not.toThrow();
	});
});
