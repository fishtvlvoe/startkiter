import { getSession } from "@auth/lib/server";
import { db } from "@startkiter/database";
import { notFound, redirect } from "next/navigation";

import { CoursePackMissionPlayer } from "./mission-player";
import { parseStoredMission } from "./mission-data";

type CoursePackPageProps = {
	params: Promise<{ coursePackId: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CoursePackPage({ params }: CoursePackPageProps) {
	const session = await getSession();
	if (!session) redirect("/login");

	const { coursePackId } = await params;
	const coursePack = await db.coursePack.findUnique({
		where: { id: coursePackId },
		include: { missions: { orderBy: { sortOrder: "asc" } } },
	});

	if (!coursePack) notFound();

	const missions = coursePack.missions.map((mission) => ({
		id: mission.id,
		title: mission.title,
		goal: mission.goal,
		sortOrder: mission.sortOrder,
		mission: parseStoredMission(mission.missionData),
	}));

	return (
		<div className="mx-auto max-w-4xl space-y-6 p-6">
			<div>
				<p className="text-sm text-muted-foreground">CoursePack 任務包</p>
				<h1 className="mt-1 text-3xl font-semibold">{coursePack.title}</h1>
			</div>
			<CoursePackMissionPlayer missions={missions} />
		</div>
	);
}
