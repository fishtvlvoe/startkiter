import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
	title: "開站包",
	description: "StartKiter 繁中站殼與登入",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="zh-TW">
			<body>{children}</body>
		</html>
	);
}
