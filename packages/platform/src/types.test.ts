import { describe, expect, it } from "vitest";
import type { PluginManifest } from "./types";

describe("PluginManifest type tests (Task 1.1, 1.2, 1.3)", () => {
	it("1.1 accepts valid manifest with route, menu, content, and dataSpec", () => {
		const validManifest: PluginManifest = {
			id: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			mount: {
				route: { path: "/test" },
				menu: { label: "測試", icon: "🧪", order: 10, requiresOperator: false },
				content: { kind: "auto", boundTo: "/test" },
			},
			dataSpec: "content",
		};
		expect(validManifest.id).toBe("test-plugin");
		expect(validManifest.mount.content?.kind).toBe("auto");
	});

	it("1.1 rejects unsupported mount keys with type error", () => {
		const invalidMountManifest: PluginManifest = {
			id: "invalid-mount",
			name: "Invalid Mount",
			version: "1.0.0",
			mount: {
				// @ts-expect-error - 'invalidKey' does not exist in type
				invalidKey: { path: "/invalid" },
			},
			dataSpec: "none",
		};
		expect(invalidMountManifest.id).toBe("invalid-mount");
	});

	it("1.2 accepts dataSpec 'content' and 'none', but rejects 'payment'", () => {
		const contentManifest: PluginManifest = {
			id: "content-plugin",
			name: "Content Plugin",
			version: "1.0.0",
			mount: {},
			dataSpec: "content",
		};
		const noneManifest: PluginManifest = {
			id: "none-plugin",
			name: "None Plugin",
			version: "1.0.0",
			mount: {},
			dataSpec: "none",
		};

		const invalidDataSpecManifest: PluginManifest = {
			id: "invalid-data-spec",
			name: "Invalid Data Spec",
			version: "1.0.0",
			mount: {},
			// @ts-expect-error - Type '"payment"' is not assignable to type '"content" | "none"'
			dataSpec: "payment",
		};

		expect(contentManifest.dataSpec).toBe("content");
		expect(noneManifest.dataSpec).toBe("none");
		expect(invalidDataSpecManifest.dataSpec).toBe("payment");
	});

	it("1.3 accepts content.kind 'auto', 'shortcode', 'block', but rejects invalid kinds", () => {
		const autoManifest: PluginManifest = {
			id: "auto-plugin",
			name: "Auto Plugin",
			version: "1.0.0",
			mount: {
				content: { kind: "auto" },
			},
			dataSpec: "content",
		};

		const shortcodeManifest: PluginManifest = {
			id: "shortcode-plugin",
			name: "Shortcode Plugin",
			version: "1.0.0",
			mount: {
				content: { kind: "shortcode" },
			},
			dataSpec: "content",
		};

		const blockManifest: PluginManifest = {
			id: "block-plugin",
			name: "Block Plugin",
			version: "1.0.0",
			mount: {
				content: { kind: "block" },
			},
			dataSpec: "content",
		};

		const invalidKindManifest: PluginManifest = {
			id: "invalid-kind-plugin",
			name: "Invalid Kind Plugin",
			version: "1.0.0",
			mount: {
				// @ts-expect-error - Type '"custom"' is not assignable to type '"auto" | "shortcode" | "block"'
				content: { kind: "custom" },
			},
			dataSpec: "content",
		};

		expect(autoManifest.mount.content?.kind).toBe("auto");
		expect(shortcodeManifest.mount.content?.kind).toBe("shortcode");
		expect(blockManifest.mount.content?.kind).toBe("block");
		expect(invalidKindManifest.mount.content?.kind).toBe("custom");
	});
});
