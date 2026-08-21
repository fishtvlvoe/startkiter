import { describe, expect, it } from "vitest";
import type { PluginManifest } from "../types";
import type { SiteTemplate } from "./types";
import { SITE_TEMPLATES } from "./index";

describe("SiteTemplate type and SITE_TEMPLATES (buyer-template-selection)", () => {
	describe("17.1 Template array contains at least two entries", () => {
		it("SITE_TEMPLATES length is >= 2 with unique ids", () => {
			expect(SITE_TEMPLATES.length).toBeGreaterThanOrEqual(2);
			const ids = SITE_TEMPLATES.map((template) => template.id);
			expect(new Set(ids).size).toBe(ids.length);
		});
	});

	describe("17.2 Template with missing required fields fails type check", () => {
		it("omitting defaultMountConfig is a type error", () => {
			// @ts-expect-error - Property 'defaultMountConfig' is missing in type
			const incompleteTemplate: SiteTemplate = {
				id: "broken",
				name: "Broken",
				description: "missing defaultMountConfig",
				previewImagePath: "/preview/broken.png",
				styleTokenOverrides: {},
				aiPromptHint: "hint",
			};

			expect(incompleteTemplate.id).toBe("broken");
		});
	});

	describe("17.5 Templates connect to mount points through defaultMountConfig", () => {
		it("defaultMountConfig entry is assignable to Partial<PluginManifest>", () => {
			const entry: Partial<PluginManifest> = {
				id: "course",
				mount: {
					menu: { label: "課程", icon: "book-open", order: 1 },
				},
			};

			const template: SiteTemplate = {
				id: "compat-check",
				name: "Compat",
				description: "type compatibility",
				previewImagePath: "/preview/compat.png",
				defaultMountConfig: [entry],
				styleTokenOverrides: {},
				aiPromptHint: "hint",
			};

			const assigned: Partial<PluginManifest> = template.defaultMountConfig[0];
			expect(assigned.id).toBe("course");
		});
	});
});
