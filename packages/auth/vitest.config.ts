import { defineConfig } from "vitest/config";

export default defineConfig({
	oxc: {
		jsx: {
			runtime: "automatic",
		},
	},
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts", "**/*.test.tsx"],
		exclude: ["**/node_modules/**", "**/dist/**", "**/.turbo/**"],
	},
});

