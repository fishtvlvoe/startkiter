import { getSession } from "@auth/lib/server";
import { redirect } from "next/navigation";

import { isCourseOperator } from "../../../../../../lib/course-operator";

import { CourseStudioClient } from "./course-studio-client";

export default async function CourseAdminStudioPage() {
	const session = await getSession();
	if (!session || !isCourseOperator(session.user)) {
		redirect("/");
	}

	return <CourseStudioClient />;
}
