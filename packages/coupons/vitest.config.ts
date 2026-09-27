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
		env: {
			DATABASE_URL: process.env.DATABASE_URL || "postgresql://fishtv@localhost:5432/startkiter",
		},
		include: ["**/*.test.ts", "**/*.test.tsx"],
		exclude: ["**/node_modules/**", "**/dist/**", "**/.turbo/**"],
	},
});

