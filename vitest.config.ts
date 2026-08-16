import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: [
			"packages/**/*.test.ts",
			"apps/saas/lib/**/*.test.ts",
			"docs/design-system-demo/**/*.test.ts",
		],
	},
});
