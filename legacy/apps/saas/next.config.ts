import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: [
		"@startkiter/auth",
		"@startkiter/course",
		"@startkiter/database",
		"@startkiter/github-kit",
		"@startkiter/i18n",
		"@startkiter/payments",
		"@startkiter/site-agent",
		"@startkiter/ui",
		"@startkiter/utils",
	],
};

export default nextConfig;
