import { getSession } from "@auth/lib/server";
import { resolvePagesCmsAccess } from "@startkiter/api/modules/pages-cms/access";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AdminPagesLayout({ children }: PropsWithChildren) {
	const session = await getSession();
	const access = resolvePagesCmsAccess(session, process.env.ADMIN_EMAIL);
	if (access === 401) redirect("/login");
	if (access === 403) redirect("/");
	return children;
}
