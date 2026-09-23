import { getSession } from "@auth/lib/server";
import { hasAnyCourseInstructorAssignment } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { isOperator as checkIsOperator } from "@startkiter/permissions";
import { PageHeader } from "@shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AdminLayout({ children }: PropsWithChildren) {
	const t = await getTranslations("admin");
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	// Nested layouts can render before the parent authenticated layout calls setup(), so do not use permix.check here.
	const isOperator = checkIsOperator(session.user, process.env.ADMIN_EMAIL);
	const isInstructor = !isOperator && (await hasAnyCourseInstructorAssignment(session.user.id));
	if (!isOperator && !isInstructor) {
		redirect("/");
	}

	return (
		<>
			<PageHeader title={t("title")} subtitle={t("description")} />

			{children}
		</>
	);
}
