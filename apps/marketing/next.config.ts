import { withContentCollections } from "@content-collections/next";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./modules/i18n/request.ts");

const nextConfig: NextConfig = {
	output: "standalone",
	experimental: {
		useTypeScriptCli: true,
	},
	transpilePackages: ["@startkiter/i18n", "@startkiter/ui", "@startkiter/payments", "@startkiter/database", "@startkiter/utils"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "placehold.co",
			},
			{
				protocol: "https",
				hostname: "picsum.photos",
			},
		],
	},
};

export default withContentCollections(withNextIntl(nextConfig));
