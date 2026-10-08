"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "./PageHeader";

export function AdminLayoutHeader({
	title,
	subtitle,
	className,
}: {
	title: string;
	subtitle?: string;
	className?: string;
}) {
	const pathname = usePathname();
	const normalizedPathname = pathname ? pathname.replace(/\/+$/, "") : "";

	// 在 /admin/dashboard（含結尾斜線）控制台不重複渲染頂部「後台管理」標題
	if (normalizedPathname === "/admin/dashboard") {
		return null;
	}

	return <PageHeader title={title} subtitle={subtitle} className={className} />;
}
