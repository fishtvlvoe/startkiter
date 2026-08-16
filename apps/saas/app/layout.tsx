import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_TC } from "next/font/google";

import { SiteFooter, resolveSupportEmail } from "./components/site-footer";
import { ThemeProvider } from "./components/theme-provider";
import { getRequestLocale } from "../lib/request-locale";
import "./globals.css";

const display = DM_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-display-loaded",
	display: "swap",
});

const body = Noto_Sans_TC({
	subsets: ["latin"],
	weight: ["400", "500", "700"],
	variable: "--font-body-loaded",
	display: "swap",
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
		<html lang={htmlLang} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
			<body style={{ fontFamily: 'var(--font-display-loaded), var(--font-body-loaded), "DM Sans", "Noto Sans TC", sans-serif' }}>
				<ThemeProvider>
					{children}
					<SiteFooter supportEmail={supportEmail} />
				</ThemeProvider>
			</body>
		</html>
	);
}
