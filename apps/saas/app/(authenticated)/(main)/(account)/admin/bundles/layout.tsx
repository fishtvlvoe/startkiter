import { requireGlobalAdmin } from "../../../../../../lib/admin-access";
import type { PropsWithChildren } from "react";

export default async function AdminBundlesLayout({ children }: PropsWithChildren) {
	await requireGlobalAdmin();
	return children;
}
