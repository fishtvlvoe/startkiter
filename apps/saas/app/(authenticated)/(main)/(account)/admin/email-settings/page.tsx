import { db } from "@startkiter/database";

import { requireGlobalAdmin } from "../../../../../../lib/admin-access";
import EmailSettingsPanel from "./EmailSettingsPanel";

export default async function EmailSettingsPage() {
	await requireGlobalAdmin();

	const courses = await db.course.findMany({
		orderBy: { title: "asc" },
		select: {
			id: true,
			title: true,
			welcomeEmail: {
				select: { enabled: true, subjectTemplate: true, markdownTemplate: true },
			},
		},
	});

	return <EmailSettingsPanel initialCourses={courses} />;
}
