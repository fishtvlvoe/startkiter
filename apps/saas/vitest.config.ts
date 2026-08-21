import path from "node:path";

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
		exclude: ["**/node_modules/**", "**/tests/**", "**/.next/**"],
		env: {
			DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
		},
	},
	resolve: {
		alias: {
			"@config": path.resolve(import.meta.dirname, "./config"),
			"@shared": path.resolve(import.meta.dirname, "./modules/shared"),
			"@auth": path.resolve(import.meta.dirname, "./modules/auth"),
			"@organizations": path.resolve(import.meta.dirname, "./modules/organizations"),
			"@payments": path.resolve(import.meta.dirname, "./modules/payments"),
			"@i18n": path.resolve(import.meta.dirname, "./modules/i18n"),
			"@admin": path.resolve(import.meta.dirname, "./modules/admin"),
			"@ai": path.resolve(import.meta.dirname, "./modules/ai"),
			"@onboarding": path.resolve(import.meta.dirname, "./modules/onboarding"),
			"@deployment": path.resolve(import.meta.dirname, "./modules/deployment"),
			"@settings": path.resolve(import.meta.dirname, "./modules/settings"),
			"@course": path.resolve(import.meta.dirname, "./modules/course"),
		},
	},
});
