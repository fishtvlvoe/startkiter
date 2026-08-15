import type { Metadata } from "next";
import { Fira_Sans, Noto_Sans_TC } from "next/font/google";

import "./globals.css";

const display = Fira_Sans({
	subsets: ["latin"],
	weight: ["600", "700"],
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="zh-TW" className={`${display.variable} ${body.variable}`}>
			<body style={{ fontFamily: "var(--font-body-loaded), var(--font-body)" }}>{children}</body>
		</html>
	);
}
