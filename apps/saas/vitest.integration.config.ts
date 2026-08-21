import path from "node:path";

import { defineConfig } from "vitest/config";

/**
 * 專供需要真實 DB 的跨套件整合測試（apps/saas/tests/integration/**）。
 * 不繼承 vitest.config.ts 的 DATABASE_URL mock 覆蓋——那份是給預設 `pnpm test` 用的，
 * 刻意擋掉一般單元測試誤連真實 DB；這裡的測試本來就要連真實 DB，用 dotenv-cli 帶真的 .env。
 */
export default defineConfig({
	oxc: {
		jsx: {
			runtime: "automatic",
		},
	},
	test: {
		globals: true,
		environment: "node",
		include: ["tests/integration/**/*.test.ts"],
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
