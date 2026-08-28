import type { MarketingConfig } from "./types";

export const config = {
	appName: "StartKiter 開站包",
	docsUrl: process.env.NEXT_PUBLIC_DOCS_URL as string | undefined,
	saasUrl: process.env.NEXT_PUBLIC_SAAS_URL as string | undefined,
	enabledThemes: ["light", "dark"],
	defaultTheme: "light",
} as const satisfies MarketingConfig;
