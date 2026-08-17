import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const themeState = vi.hoisted(() => ({
	theme: "light",
	resolvedTheme: "light",
	setTheme: vi.fn((nextTheme: string) => {
		themeState.theme = nextTheme;
		document.documentElement.classList.toggle("dark", nextTheme === "dark");
	}),
}));

vi.mock("next-themes", () => ({
	useTheme: () => themeState,
}));

import { ColorModeToggle } from "./index";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const localDirectory = resolve(sourceDirectory, "components");
const officialDirectory = resolve(
	sourceDirectory,
	"../../../vendor/supastarter-nextjs/packages/ui/components",
);

const readComponent = (directory: string, name: string) =>
	readFileSync(resolve(directory, `${name}.tsx`), "utf8");

const removeColorModePreservedMarkers = (source: string) =>
	source
		.replace(/\n\s*data-slot="color-mode-toggle"/g, "")
		.replace(/\n\s*"color-mode-toggle",/g, "");

const colorModeLabels = {
	system: "系統",
	light: "淺色",
	dark: "深色",
};

afterEach(() => {
	document.documentElement.classList.remove("dark");
	themeState.theme = "light";
	themeState.resolvedTheme = "light";
	themeState.setTheme.mockClear();
});

describe("official interactive component source parity", () => {
	it("uses Base UI Tooltip, official Spinner source, and official ColorModeToggle APIs", () => {
		const tooltipSource = readComponent(localDirectory, "tooltip");
		const spinnerSource = readComponent(localDirectory, "spinner");
		const colorModeSource = readComponent(localDirectory, "color-mode-toggle");

		expect(tooltipSource).toContain('@base-ui/react/tooltip');
		expect(tooltipSource).not.toMatch(/from ["']radix-ui["']/);
		expect(tooltipSource).toBe(readComponent(officialDirectory, "tooltip"));

		expect(spinnerSource).not.toMatch(/radix-ui|@base-ui\/react/);
		expect(spinnerSource).toBe(readComponent(officialDirectory, "spinner"));

		expect(colorModeSource).not.toMatch(/radix-ui|@base-ui\/react/);
		expect(colorModeSource).not.toContain("asChild");
		expect(colorModeSource).toContain("labels: Record<ColorMode, string>");
		expect(removeColorModePreservedMarkers(colorModeSource)).toBe(
			readComponent(officialDirectory, "color-mode-toggle"),
		);
	});

	it("keeps ColorModeToggle dark-mode behavior on the document root", () => {
		const { container } = render(
			<ColorModeToggle labels={colorModeLabels} modes={["light", "dark"]} />,
		);

		const darkModeButton = container.querySelector<HTMLButtonElement>(
			'[data-test="color-mode-toggle-item-dark"]',
		);

		expect(darkModeButton).not.toBeNull();
		fireEvent.click(darkModeButton as HTMLButtonElement);

		expect(themeState.setTheme).toHaveBeenCalledWith("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		const lightModeButton = container.querySelector<HTMLButtonElement>(
			'[data-test="color-mode-toggle-item-light"]',
		);
		fireEvent.click(lightModeButton as HTMLButtonElement);

		expect(themeState.setTheme).toHaveBeenLastCalledWith("light");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});
});
