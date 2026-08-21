import { auth } from "@startkiter/auth";
import { NextResponse } from "next/server";

import { checkMcpConfig, unauthenticatedResponse } from "./lib/guard";
import { handleMcpMethod } from "./lib/handler";

export async function GET(request: Request) {
	const configError = checkMcpConfig();
	if (configError) return configError;

	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return unauthenticatedResponse();

	return NextResponse.json({
		status: "ready",
	});
}

export async function POST(request: Request) {
	const configError = checkMcpConfig();
	if (configError) return configError;

	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return unauthenticatedResponse();

	let message: unknown;
	try {
		message = await request.json();
	} catch {
		return NextResponse.json({ error: "parse_error" }, { status: 400 });
	}

	if (!message || typeof message !== "object") {
		return NextResponse.json({ error: "invalid_request" }, { status: 400 });
	}

	const { jsonrpc, id, method, params } = message as Record<string, unknown>;
	if (jsonrpc !== "2.0" || typeof method !== "string") {
		return NextResponse.json(
			{ jsonrpc: "2.0", id: id ?? null, error: { code: -32600, message: "Invalid Request" } },
			{ status: 400 },
		);
	}

	const response = await handleMcpMethod(method, params, session.user.id);

	if ("error" in response) {
		return NextResponse.json({ jsonrpc: "2.0", id, error: response.error });
	}

	return NextResponse.json({ jsonrpc: "2.0", id, result: response.result });
}
