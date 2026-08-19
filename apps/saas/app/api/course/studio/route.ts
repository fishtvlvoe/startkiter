import {
	CourseStudioError,
	executeStudioCommand,
	getStudioSnapshot,
	studioCommandSchema,
} from "@startkiter/api/modules/course/studio-service";
import { auth } from "@startkiter/auth";
import { NextResponse } from "next/server";

import { isCourseOperator } from "../../../../lib/course-operator";

type OperatorResult =
	| { error: NextResponse }
	| { userId: string };

async function requireOperator(request: Request): Promise<OperatorResult> {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return { error: NextResponse.json({ error: "authentication_required" }, { status: 401 }) };
	}
	if (!isCourseOperator(session.user)) {
		return { error: NextResponse.json({ error: "course_studio_forbidden" }, { status: 403 }) };
	}
	return { userId: session.user.id };
}

async function execute(request: Request): Promise<NextResponse> {
	const operator = await requireOperator(request);
	if ("error" in operator) {
		return operator.error;
	}

	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return NextResponse.json({ error: "invalid_json" }, { status: 400 });
	}

	const command = studioCommandSchema.safeParse(input);
	if (!command.success) {
		return NextResponse.json({ error: "invalid_studio_command" }, { status: 400 });
	}

	try {
		const result = await executeStudioCommand(command.data, operator.userId);
		return NextResponse.json({ result });
	} catch (error) {
		if (error instanceof CourseStudioError) {
			return NextResponse.json({ error: error.message }, { status: error.status });
		}
		throw error;
	}
}

export async function GET(request: Request): Promise<NextResponse> {
	const operator = await requireOperator(request);
	if ("error" in operator) {
		return operator.error;
	}

	return NextResponse.json(await getStudioSnapshot(operator.userId));
}

export async function POST(request: Request): Promise<NextResponse> {
	return execute(request);
}

export async function PATCH(request: Request): Promise<NextResponse> {
	return execute(request);
}

export async function DELETE(request: Request): Promise<NextResponse> {
	return execute(request);
}
