export type Surface = "code_editor" | "terminal" | "structured_form" | "embedded_tool";

/** Static adapter from an imported Mission action to an existing course block. */
export const surfaceBlockMap: Record<Surface, string> = {
	code_editor: "WebContainerSandbox",
	terminal: "WebContainerSandbox",
	structured_form: "DialogueWindow",
	embedded_tool: "ConceptCompare",
};

export type SurfaceBlockResolution =
	| { ok: true; blockName: string }
	| { ok: false; error: string };

export function resolveSurfaceBlock(surface: string): SurfaceBlockResolution {
	const blockName = surfaceBlockMap[surface as Surface];

	if (blockName) {
		return { ok: true, blockName };
	}

	return {
		ok: false,
		error: `Unsupported Mission action surface: ${surface}`,
	};
}
