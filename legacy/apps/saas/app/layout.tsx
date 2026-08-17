import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter, resolveSupportEmail } from "./components/site-footer";
import { ThemeProvider } from "./components/theme-provider";
import { getRequestLocale } from "../lib/request-locale";
import "./globals.css";

const sansFont = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "開站包",
	description: "一次買斷，帶走課與終身代碼包",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const supportEmail = resolveSupportEmail();
	const locale = await getRequestLocale();
	const htmlLang = locale === "zh-cn" ? "zh-CN" : locale === "en" ? "en" : "zh-TW";

	return (
		<html lang={htmlLang} className={sansFont.variable} suppressHydrationWarning>
			<body style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}>
				<ThemeProvider>
					{children}
					<SiteFooter supportEmail={supportEmail} />
				</ThemeProvider>
			</body>
		</html>
	);
}
