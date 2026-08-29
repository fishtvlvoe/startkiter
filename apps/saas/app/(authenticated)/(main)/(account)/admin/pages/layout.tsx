import { requireGlobalAdmin } from "../../../../../../lib/admin-access";
import type { PropsWithChildren } from "react";

export default async function AdminPagesLayout({ children }: PropsWithChildren) {
	await requireGlobalAdmin();
	return children;
}
