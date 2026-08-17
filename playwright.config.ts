import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const browserChannel = process.env.E2E_CHANNEL === "chrome" ? "chrome" : undefined;
const useLocalWebServer =
	process.env.E2E_SKIP_WEBSERVER !== "1" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseURL);

export default defineConfig({
	testDir: "./e2e",
	testMatch: "**/*.spec.ts",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "line" : "list",
	use: {
		baseURL,
		channel: browserChannel,
		testIdAttribute: "data-test",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "off",
		headless: true,
	},
	webServer: useLocalWebServer
		? {
				command: "pnpm --filter @startkiter/saas dev",
				url: baseURL,
				reuseExistingServer: !process.env.CI,
				timeout: 120_000,
			}
		: undefined,
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
