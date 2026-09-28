import { readFileSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";
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
import { getIconAsset, ICON_ASSETS, ThemedIcon } from "./icon-assets";
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

	it("同一個命名空間（nav 或 account）裡，每個圖示檔案內容都不相同（防止複製貼上失誤讓所有選單顯示同一個佔位圖示）", () => {
		const publicDir = join(__dirname, "../../../public/icons");
		const hashesByNamespaceAndFile = new Map<string, Map<string, string[]>>();
		for (const id of Object.keys(ICON_ASSETS)) {
			const [namespace, iconName] = id.split(".");
			const asset = ICON_ASSETS[id as keyof typeof ICON_ASSETS];
			const hashesByFile = hashesByNamespaceAndFile.get(namespace) ?? new Map<string, string[]>();
			for (const variant of ["light", "dark"] as const) {
				const filePath = join(publicDir, asset[variant].replace(/^\/icons\//, ""));
				const content = readFileSync(filePath, "utf8");
				const hash = createHash("md5").update(content).digest("hex");
				const key = `${iconName}.${variant}`;
				const list = hashesByFile.get(hash) ?? [];
				list.push(key);
				hashesByFile.set(hash, list);
			}
			hashesByNamespaceAndFile.set(namespace, hashesByFile);
		}
		const duplicateGroups = [...hashesByNamespaceAndFile.values()].flatMap((hashesByFile) =>
			[...hashesByFile.values()].filter((group) => group.length > 1),
		);
		expect(duplicateGroups, `重複的圖示檔案：${JSON.stringify(duplicateGroups)}`).toEqual([]);
	});
});
