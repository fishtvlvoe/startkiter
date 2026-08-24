import { OrganizationList } from "@admin/component/organizations/OrganizationList";
import { requireGlobalAdmin } from "../../../../../../lib/admin-access";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("admin.organizations");

	return {
		title: t("title"),
	};
}

export default async function AdminOrganizationsPage() {
	await requireGlobalAdmin();
	return <OrganizationList />;
}
