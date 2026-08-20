import { NextResponse } from "next/server";

import { isMcpConfigMissing } from "./config";

export function mcpConfigErrorResponse() {
	return NextResponse.json(
		{ error: "service_unavailable", message: "MCP Gateway is not configured" },
		{ status: 503 },
	);
}

export function unauthenticatedResponse() {
	const baseUrl = process.env.NEXT_PUBLIC_SAAS_URL ?? "";
	const loginUrl = `${baseUrl}/login`.replace(/\/$/, "");
	return NextResponse.json(
		{ error: "authentication_required", loginUrl },
		{ status: 401 },
	);
}

export function checkMcpConfig() {
	if (isMcpConfigMissing()) {
		return mcpConfigErrorResponse();
	}
	return null;
}
