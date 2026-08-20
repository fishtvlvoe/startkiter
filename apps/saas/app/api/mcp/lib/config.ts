export const SERVER_INFO = {
	name: "StartKiter MCP Gateway",
	version: "1.0.0",
};

export const CAPABILITIES = {
	tools: {},
};

export const PROTOCOL_VERSION = "2024-11-05";

export const READ_ONLY_TOOLS = ["get_my_orders", "get_my_course_progress"] as const;

export type ReadOnlyToolName = (typeof READ_ONLY_TOOLS)[number];

export function isMcpConfigMissing(): boolean {
	return !process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET;
}
