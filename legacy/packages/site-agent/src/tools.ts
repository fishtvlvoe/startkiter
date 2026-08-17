import type { AgentDataAccess, AgentToolName } from "./types";
import { ALLOWED_TOOLS } from "./types";

export type ToolResult =
	| { ok: true; tool: AgentToolName; data: unknown }
	| { ok: false; error: "unauthenticated" | "unknown_tool" };

export async function runAgentTool(args: {
	userId: string | null | undefined;
	tool: string;
	data: AgentDataAccess;
}): Promise<ToolResult> {
	if (!args.userId) {
		return { ok: false, error: "unauthenticated" };
	}
	if (!ALLOWED_TOOLS.includes(args.tool as AgentToolName)) {
		return { ok: false, error: "unknown_tool" };
	}
	if (args.tool === "get_my_orders") {
		const orders = await args.data.listOrdersForUser(args.userId);
		return { ok: true, tool: "get_my_orders", data: { orders } };
	}
	const progress = await args.data.listCourseProgressForUser(args.userId);
	return { ok: true, tool: "get_my_course_progress", data: progress };
}
