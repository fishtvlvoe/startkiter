export type AgentOrder = {
	orderNo: string;
	sku: string;
	status: string;
	amount: number;
	courseAccess: boolean;
	kitClaimEligible: boolean;
};

export type AgentLessonProgress = {
	lessonId: string;
	title: string;
	status: "not_tracked" | "accessible" | "locked";
};

export type AgentDataAccess = {
	listOrdersForUser: (userId: string) => Promise<AgentOrder[]>;
	listCourseProgressForUser: (userId: string) => Promise<{
		courseAccess: boolean;
		lessons: AgentLessonProgress[];
	}>;
};

export type AgentToolName = "get_my_orders" | "get_my_course_progress";

export type AgentProvider = {
	complete: (args: {
		message: string;
		system: string;
	}) => Promise<{ assistantMessage: string }>;
};

export const ALLOWED_TOOLS: readonly AgentToolName[] = [
	"get_my_orders",
	"get_my_course_progress",
] as const;
