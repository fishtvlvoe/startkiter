import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const appRoot = resolve(scriptDirectory, "..");
const registryPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : resolve(appRoot, "modules/shared/lib/icon-assets.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const missing = [];
for (const [iconId, variants] of Object.entries(registry)) {
	for (const variant of ["light", "dark"]) {
		const assetPath = variants?.[variant];
		if (typeof assetPath !== "string" || !existsSync(resolve(appRoot, "public", assetPath.replace(/^\//, "")))) {
			missing.push(`${iconId}:${variant}`);
		}
	}
}
if (missing.length > 0) {
	console.error(`Missing icon assets: ${missing.join(", ")}`);
	process.exitCode = 1;
} else {
	console.log(`Icon asset check passed: ${Object.keys(registry).length} icons with light/dark variants.`);
}
