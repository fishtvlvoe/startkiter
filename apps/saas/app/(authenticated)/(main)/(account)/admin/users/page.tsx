import { UserList } from "@admin/component/users/UserList";
import { requireGlobalAdmin } from "../../../../../../lib/admin-access";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("admin.users");

	return {
		title: t("title"),
	};
}

export default async function AdminUserPage() {
	await requireGlobalAdmin();

	return (
		<div>
			<UserList />
		</div>
	);
}
