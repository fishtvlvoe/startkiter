import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { createNotification } from "@startkiter/notifications";
import { isOperator } from "@startkiter/permissions";
import { NextResponse } from "next/server";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	}

	if (!isOperator(session.user, process.env.ADMIN_EMAIL)) {
		return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
	}

	let body: Record<string, unknown>;
	try {
		const parsed: unknown = await request.json();
		if (!isPlainObject(parsed)) {
			return NextResponse.json({ error: "invalid_body" }, { status: 400 });
		}
		body = parsed;
	} catch {
		return NextResponse.json({ error: "invalid_body" }, { status: 400 });
	}

	const { userId, title, message } = body;

	if (typeof userId !== "string" || userId.trim() === "") {
		return NextResponse.json({ error: "invalid_userId" }, { status: 400 });
	}

	if (typeof title !== "string" || title.trim().length < 1 || title.trim().length > 120) {
		return NextResponse.json({ error: "invalid_title" }, { status: 400 });
	}

	if (typeof message !== "string" || message.trim().length < 1 || message.trim().length > 500) {
		return NextResponse.json({ error: "invalid_message" }, { status: 400 });
	}

	const targetUser = await db.user.findUnique({
		where: { id: userId },
	});

	if (!targetUser) {
		return NextResponse.json({ error: "user_not_found" }, { status: 404 });
	}

	const created = await createNotification({
		userId,
		type: "APP_UPDATE",
		data: {
			title: title.trim(),
			message: message.trim(),
		},
	});

	if (!created) {
		return NextResponse.json({ created: false }, { status: 200 });
	}

	return NextResponse.json({ created: true, id: created.id }, { status: 201 });
}
