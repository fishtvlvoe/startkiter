import { describe, expect, it } from "vitest";

import { resolveSurfaceBlock, surfaceBlockMap } from "./surface-block-map";

describe("surfaceBlockMap", () => {
	it("將每個 Mission action surface 對應到既有積木", () => {
		expect(surfaceBlockMap).toEqual({
			code_editor: "WebContainerSandbox",
			terminal: "WebContainerSandbox",
			structured_form: "DialogueWindow",
			embedded_tool: "ConceptCompare",
		});
	});

	it("找不到對照時回傳 fail-closed 結果，不拋出例外", () => {
		expect(resolveSurfaceBlock("unknown_surface")).toEqual({
			ok: false,
			error: "Unsupported Mission action surface: unknown_surface",
		});
	});
});
