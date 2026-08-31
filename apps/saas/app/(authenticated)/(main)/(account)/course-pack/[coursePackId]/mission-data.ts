import { CoursePackSchema, type Mission } from "@startkiter/course/src/course-pack/schema";

export type LearnerMission = {
	id: string;
	title: string;
	goal: string;
	sortOrder: number;
	mission: Mission | null;
};

export function parseStoredMission(missionData: unknown): Mission | null {
	const result = CoursePackSchema.shape.missions.element.safeParse(missionData);
	return result.success ? result.data : null;
}
