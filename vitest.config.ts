import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	root: repoRoot,
	test: {
		environment: "node",
		include: [
			"packages/**/*.test.ts",
			"apps/saas/lib/**/*.test.ts",
			"docs/design-system-demo/**/*.test.ts",
		],
	},
});
