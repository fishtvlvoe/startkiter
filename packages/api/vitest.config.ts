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
			DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
		},
	},
});
