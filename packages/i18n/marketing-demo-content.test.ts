import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import de from "./translations/de/marketing.json";
import en from "./translations/en/marketing.json";
import es from "./translations/es/marketing.json";
import fr from "./translations/fr/marketing.json";
import zhCn from "./translations/zh-cn/marketing.json";
import zhTw from "./translations/zh-tw/marketing.json";

const forbiddenIdentities = ["Acme", "Maya Chen", "Jonas Weber", "Amelia Ortiz"];
const forbiddenTemplateMarkers = [
	/placeholder/i,
	/edit the .* file/i,
	/demo it/i,
	/choose a workspace/i,
	/workspace|organisation|organization|billing|subscription|free trial|invite|USD|churn|revenue/i,
	/\/images\/blog\/blog-(workspaces|billing|guest-access)\.webp/i,
];
const contentRoots = [resolve(import.meta.dirname, "translations"), resolve(import.meta.dirname, "../../apps/marketing")];
const marketingCatalogRoot = resolve(import.meta.dirname, "translations");
const marketingContentRoot = resolve(import.meta.dirname, "../../apps/marketing/content");
const catalogs = [zhTw, zhCn, en, de, fr, es];

function listFiles(root: string): string[] {
	return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
		if (
			entry.isSymbolicLink() ||
			[
				".content-collections",
				".next",
				".turbo",
				"coverage",
				"dist",
				"node_modules",
				"playwright-report",
				"test-results",
			].includes(entry.name)
		) {
			return [];
		}
		const path = join(root, entry.name);
		if (entry.isDirectory()) {
			return listFiles(path);
		}
		return [path];
	});
}

describe("marketing content", () => {
	it("contains no template demo identities", () => {
		const matches = contentRoots.flatMap((root) =>
			listFiles(root).flatMap((file) => {
				const contents = readFileSync(file, "utf8");
				return forbiddenIdentities
					.filter((identity) => contents.includes(identity))
					.map((identity) => `${file}: ${identity}`);
			}),
		);

		expect(matches).toEqual([]);
	});

	it("contains no visible template content markers", () => {
		const catalogFiles = listFiles(marketingCatalogRoot).filter((file) => file.endsWith("/marketing.json"));
		const catalogMatches = catalogFiles.flatMap((file) => {
			const values: string[] = [];
			const collectStrings = (value: unknown) => {
				if (typeof value === "string") {
					values.push(value);
					return;
				}
				if (Array.isArray(value)) {
					value.forEach(collectStrings);
					return;
				}
				if (value && typeof value === "object") {
					Object.values(value).forEach(collectStrings);
				}
			};
			collectStrings(JSON.parse(readFileSync(file, "utf8")));
			return forbiddenTemplateMarkers
				.filter((marker) => values.some((value) => marker.test(value)))
				.map((marker) => `${file}: ${marker}`);
		});
		const contentMatches = listFiles(marketingContentRoot).flatMap((file) => {
			const contents = readFileSync(file, "utf8");
			return forbiddenTemplateMarkers
				.filter((marker) => marker.test(contents))
				.map((marker) => `${file}: ${marker}`);
		});

		expect([...catalogMatches, ...contentMatches]).toEqual([]);
	});

	it.each(catalogs)("keeps blog and contact summaries specific to StartKiter", (catalog) => {
		const visibleSummaries = [
			catalog.blog?.description,
			catalog.contact?.description,
			catalog.changelog?.description,
			catalog.common?.consent?.description,
		]
			.filter((value): value is string => typeof value === "string")
			.join(" ");

		expect(visibleSummaries).not.toMatch(/workspace|organisation|organization|billing|subscription|trial|invite/i);
	});
});
