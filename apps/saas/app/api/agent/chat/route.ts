import { auth } from "@startkiter/auth";
import { runSiteAgentChat } from "@startkiter/site-agent";
import { NextResponse } from "next/server";

import { createPrismaAgentDataAccess } from "../../../../lib/agent-data";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

const noStore = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user.id) {
		return NextResponse.json(
			{ error: "authentication_required" },
			{ status: 401, headers: noStore },
		);
	}

	let message = "";
	try {
		const parsed: unknown = await request.json();
		if (isPlainObject(parsed) && typeof parsed.message === "string") {
			message = parsed.message;
		}
	} catch {
		return NextResponse.json({ error: "invalid_body" }, { status: 400, headers: noStore });
	}

	const result = await runSiteAgentChat({
		userId: session.user.id,
		message,
		data: createPrismaAgentDataAccess(),
		env: process.env,
	});

	if (!result.ok) {
		return NextResponse.json(
			{ error: result.error },
			{ status: result.httpStatus, headers: noStore },
		);
	}

	return NextResponse.json(
		{
			assistantMessage: result.assistantMessage,
			toolTraces: result.toolTraces,
		},
		{ headers: noStore },
	);
}
