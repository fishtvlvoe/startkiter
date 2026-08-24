import { getSession } from "@auth/lib/server";
import { config } from "@startkiter/auth/config";
import { hasAnyCourseInstructorAssignment } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { checkPermission } from "@startkiter/permissions";
import { Logo } from "@startkiter/ui";
import { SettingsMenu } from "@settings/components/SettingsMenu";
import { PageHeader } from "@shared/components/PageHeader";
import { BarChart3Icon, BookOpenIcon, Building2Icon, ClipboardListIcon, UsersIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const t = await getTranslations("admin");
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	// Nested layouts can render before the parent authenticated layout calls
	// setup(), so do not use permix.check here. admin.access is user-scoped.
	const isOperator = checkPermission({ user: session.user }, "admin.access");
	const isInstructor = !isOperator && (await hasAnyCourseInstructorAssignment(session.user.id));
	if (!isOperator && !isInstructor) {
		redirect("/");
	}

	const courseMenuItem = {
		title: "課程管理",
		href: "/admin/course",
		icon: <BookOpenIcon className="size-4 opacity-50" />,
	};

	return (
		<>
			<PageHeader title={t("title")} subtitle={t("description")} />

			<SettingsMenu
				className="mb-6"
				menuItems={[
					{
						avatar: <Logo className="size-8" withLabel={false} />,
						title: t("title"),
					items: isInstructor
						? [courseMenuItem]
						: [
							courseMenuItem,
							{
							title: t("menu.users"),
								href: "/admin/users",
								icon: <UsersIcon className="size-4 opacity-50" />,
							},
							{
								title: "訂單列表",
								href: "/admin/orders",
								icon: <ClipboardListIcon className="size-4 opacity-50" />,
							},
							{
								title: "營收結算",
								href: "/admin/revenue",
								icon: <BarChart3Icon className="size-4 opacity-50" />,
							},
							{
								title: "台灣統一發票",
								href: "/admin/settings/einvoice",
								icon: <ClipboardListIcon className="size-4 opacity-50" />,
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
						],
					},
				]}
			/>

			{children}
		</>
	);
}
