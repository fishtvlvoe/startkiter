import { Logo } from "@startkiter/ui";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import "./global.css";
import { source } from "@/lib/source";

const inter = Inter({
	subsets: ["latin"],
});

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="zh-TW" className={inter.className} suppressHydrationWarning>
			<body className="flex min-h-screen flex-col">
				<RootProvider>
					<DocsLayout
						tree={source.getPageTree()}
						nav={{
							title: <Logo />,
						}}
					>
						{children}
					</DocsLayout>
				</RootProvider>
				</body>
		</html>
	);
}
