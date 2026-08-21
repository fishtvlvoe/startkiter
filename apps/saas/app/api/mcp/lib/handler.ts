import { db } from "@startkiter/database";

import { CAPABILITIES, PROTOCOL_VERSION, READ_ONLY_TOOLS, SERVER_INFO, type ReadOnlyToolName } from "./config";

type McpResult = { result: unknown } | { error: { code: number; message: string } };

function toolDescription(name: ReadOnlyToolName): string {
	switch (name) {
		case "get_my_orders":
			return "List the authenticated user's orders";
		case "get_my_course_progress":
			return "List the authenticated user's course lesson progress";
	}
}

function extractClientName(params: unknown): string {
	if (
		params &&
		typeof params === "object" &&
		"clientInfo" in params &&
		params.clientInfo &&
		typeof params.clientInfo === "object" &&
		"name" in params.clientInfo &&
		typeof params.clientInfo.name === "string"
	) {
		return params.clientInfo.name;
	}
	return "unknown";
}

async function executeReadTool(name: ReadOnlyToolName, userId: string): Promise<unknown> {
	switch (name) {
		case "get_my_orders":
			return db.order.findMany({ where: { userId } });
		case "get_my_course_progress":
			return db.lessonProgress.findMany({ where: { userId } });
	}
}

export async function handleMcpMethod(
	method: string,
	params: unknown,
	userId: string,
): Promise<McpResult> {
	switch (method) {
		case "initialize": {
			const clientName = extractClientName(params);
			await db.mcpConnection.create({
				data: {
					userId,
					clientName,
					authorizedAt: new Date(),
					lastUsedAt: new Date(),
				},
			});
			return {
				result: {
					protocolVersion: PROTOCOL_VERSION,
					capabilities: CAPABILITIES,
					serverInfo: SERVER_INFO,
				},
			};
		}
		case "tools/list": {
			return {
				result: {
					tools: READ_ONLY_TOOLS.map((name) => ({
						name,
						description: toolDescription(name),
						inputSchema: { type: "object", properties: {}, required: [] },
					})),
				},
			};
		}
		case "tools/call": {
			const callParams = params as { name?: unknown; arguments?: unknown } | undefined;
			const toolName = callParams?.name;
			if (!READ_ONLY_TOOLS.includes(toolName as ReadOnlyToolName)) {
				return { error: { code: -32601, message: "Tool not found" } };
			}
			const data = await executeReadTool(toolName as ReadOnlyToolName, userId);
			await db.mcpConnection.updateMany({
				where: { userId, revokedAt: null },
				data: { lastUsedAt: new Date() },
			});
			return {
				result: {
					content: [{ type: "text", text: JSON.stringify(data) }],
					isError: false,
				},
			};
		}
		default:
			return { error: { code: -32601, message: "Method not found" } };
	}
}
