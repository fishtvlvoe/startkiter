import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const themeState = vi.hoisted(() => ({ value: "dark" }));
vi.mock("next-themes", () => ({
	useTheme: () => ({
		theme: themeState.value,
		resolvedTheme: themeState.value === "system" ? "dark" : themeState.value,
	}),
}));
import { getIconAsset, ThemedIcon } from "./icon-assets";
describe("paired icon assets", () => {
	it("selects the dark asset when the resolved color mode is dark", () => {
		themeState.value = "dark";
		const html = renderToStaticMarkup(<ThemedIcon icon="home" />);
		expect(html).toContain(getIconAsset("home", "dark"));
		expect(html).not.toContain(getIconAsset("home", "light"));
	});
	it("selects the light asset when the color mode is light", () => {
		themeState.value = "light";
		const html = renderToStaticMarkup(<ThemedIcon icon="home" />);
		expect(html).toContain(getIconAsset("home", "light"));
		expect(html).not.toContain(getIconAsset("home", "dark"));
	});
});
