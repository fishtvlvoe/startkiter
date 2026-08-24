import { getSession } from "@auth/lib/server";
import { checkPermission } from "@startkiter/permissions";
import { redirect } from "next/navigation";

export async function requireGlobalAdmin() {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!checkPermission({ user: session.user }, "admin.access")) redirect("/");
	return session;
}
