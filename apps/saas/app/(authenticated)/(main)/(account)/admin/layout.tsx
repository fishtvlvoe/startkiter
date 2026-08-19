import { getSession } from "@auth/lib/server";
import { config } from "@startkiter/auth/config";
import { checkPermission } from "@startkiter/permissions";
import { Logo } from "@startkiter/ui";
import { SettingsMenu } from "@settings/components/SettingsMenu";
import { PageHeader } from "@shared/components/PageHeader";
import { Building2Icon, UsersIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

import { isCourseOperator } from "../../../../../lib/course-operator";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const t = await getTranslations("admin");
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	// Nested layouts can render before the parent authenticated layout calls
	// setup(), so do not use permix.check here. admin.access is user-scoped.
	const isGlobalAdmin = checkPermission({ user: session.user }, "admin.access");
	const canOperateCourseStudio = isCourseOperator(session.user);
	if (!isGlobalAdmin && !canOperateCourseStudio) {
		redirect("/");
	}

	return (
		<>
			<PageHeader title={t("title")} subtitle={t("description")} />

			<SettingsMenu
				className="mb-6"
				menuItems={[
					{
						avatar: <Logo className="size-8" withLabel={false} />,
						title: t("title"),
						items: [
							...(isGlobalAdmin
								? [
										{
											title: t("menu.users"),
											href: "/admin/users",
											icon: <UsersIcon className="size-4 opacity-50" />,
										},
										...(config.organizations.enable
											? [
													{
														title: t("menu.organizations"),
														href: "/admin/organizations",
														icon: <Building2Icon className="size-4 opacity-50" />,
													},
												]
											: []),
									]
								: [
										{
											title: "Course Studio",
											href: "/admin/course",
											icon: <Logo className="size-4" withLabel={false} />,
										},
									]),
						],
					},
				]}
			/>

			{children}
		</>
	);
}
