// @ts-expect-error - PrismaPlugin is not typed
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./modules/i18n/request.ts");

const nextConfig: NextConfig = {
	experimental: {
		useTypeScriptCli: true,
	},
	// @open-sheet/core/node 匯出的 Headless XLSX exporter 依賴 vite（含 lightningcss 原生
	// binary）做內部轉譯，這些在 Node runtime 直接 require 就好，不需要／不能被 Next 打包器
	// 重新 bundle（會撞到動態 require 與 .node 原生檔解析失敗）。
	serverExternalPackages: ["@open-sheet/core", "vite", "lightningcss"],
	transpilePackages: ["@startkiter/api", "@startkiter/auth", "@startkiter/database", "@startkiter/ui"],
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Frame-Options", value: "SAMEORIGIN" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
					{ key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
				],
			},
		];
	},
	images: {
		remotePatterns: [
			{
				// google profile images
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				// github profile images
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
		],
	},
	async redirects() {
		return [
			{
				source: "/settings",
				destination: "/settings/general",
				permanent: true,
			},
			{
				// 排除 organizationSlug === "admin"：避免與靜態路由 /admin/settings 衝突
				// （Bug：舊規則會把 /admin/settings 誤判成 org slug "admin"，導致
				// redirect 到不存在的 /admin/settings/general 而 404，於 Phase 2 驗收發現並修復）
				source: "/:organizationSlug((?!admin(?:\\/|$))[^\\/]+)/settings",
				destination: "/:organizationSlug/settings/general",
				permanent: true,
			},
			{
				source: "/admin",
				destination: "/admin/users",
				permanent: true,
			},
		];
	},
	webpack: (config, { webpack, isServer }) => {
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
			}),
		);

		if (isServer) {
			config.plugins.push(new PrismaPlugin());
		}

		return config;
	},
};

export default withNextIntl(nextConfig);
