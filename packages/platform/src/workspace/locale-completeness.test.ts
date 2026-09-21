import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { MOUNT_POINTS } from "../mount-points";
import { assertLocaleCatalogCompleteness } from "./navigation";
import { toAppManifestEntries } from "./registry";

function readCatalog(locale: string): Record<string, unknown> {
	return JSON.parse(
		readFileSync(resolve(import.meta.dirname, `../../../i18n/translations/${locale}/saas.json`), "utf8"),
	) as Record<string, unknown>;
}

describe("navigation locale catalogs", () => {
	it("keep every registered menu and display name key complete", () => {
		const entries = toAppManifestEntries(MOUNT_POINTS);
		const requiredKeys = [...new Set(entries.flatMap((entry) => [entry.displayNameKey, entry.menu!.labelKey]))];
		const catalogs = {
			"zh-tw": readCatalog("zh-tw"),
			"zh-cn": readCatalog("zh-cn"),
			en: readCatalog("en"),
		};

		expect(() => assertLocaleCatalogCompleteness(requiredKeys, catalogs)).not.toThrow();
	});
});
