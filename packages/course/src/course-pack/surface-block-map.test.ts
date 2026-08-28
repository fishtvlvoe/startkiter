import { describe, expect, it } from "vitest";

import { surfaceBlockMap } from "./surface-block-map";

describe("surfaceBlockMap", () => {
	it("將每個 Mission action surface 對應到既有積木", () => {
		expect(surfaceBlockMap).toEqual({
			code_editor: "WebContainerSandbox",
			terminal: "WebContainerSandbox",
			structured_form: "DialogueWindow",
			embedded_tool: "ConceptCompare",
		});
	});
});
