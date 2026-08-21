import { auth } from "@startkiter/auth";
import { createBundle, listPublishedBundles } from "@startkiter/bundles";
import { NextResponse } from "next/server";

import { operatorHttpStatus, type OperatorSession } from "../../../lib/operator";

function getOperatorStatus(session: OperatorSession) {
	return operatorHttpStatus(session, process.env.ADMIN_EMAIL);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

const BUNDLE_STATUSES = ["draft", "published", "archived"] as const;

function parseCreateBundleBody(body: Record<string, unknown>):
	| { ok: true; input: Parameters<typeof createBundle>[0] }
	| { ok: false; error: string } {
	const { slug, title, description, priceTwd, status, courseIds } = body;

	if (typeof slug !== "string" || slug.trim() === "") {
		return { ok: false, error: "invalid_slug" };
	}
	if (typeof title !== "string" || title.trim() === "") {
		return { ok: false, error: "invalid_title" };
	}
	if (description !== undefined && description !== null && typeof description !== "string") {
		return { ok: false, error: "invalid_description" };
	}
	if (typeof priceTwd !== "number" || !Number.isInteger(priceTwd) || priceTwd <= 0) {
		return { ok: false, error: "invalid_priceTwd" };
	}
	if (typeof status !== "string" || !BUNDLE_STATUSES.includes(status as (typeof BUNDLE_STATUSES)[number])) {
		return { ok: false, error: "invalid_status" };
	}
	if (!Array.isArray(courseIds) || courseIds.length === 0 || !courseIds.every((id) => typeof id === "string")) {
		return { ok: false, error: "invalid_courseIds" };
	}

	return {
		ok: true,
		input: {
			slug,
			title,
			description: (description as string | null | undefined) ?? null,
			priceTwd,
			status: status as (typeof BUNDLE_STATUSES)[number],
			courseIds: courseIds as string[],
		},
	};
}

/** `GET /api/bundles`：前台銷售頁用，未登入可存取，只回傳已發布 Bundle（Requirement: Bundle listing API returns published bundles only）。 */
export async function GET() {
	const bundles = await listPublishedBundles();
	return NextResponse.json({ bundles });
}

/** `POST /api/bundles`：operator 專用，新增 Bundle。 */
export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const status = getOperatorStatus(session);
	if (status === 401) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	}
	if (status === 403) {
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

	const parsedBody = parseCreateBundleBody(body);
	if (!parsedBody.ok) {
		return NextResponse.json({ error: parsedBody.error }, { status: 400 });
	}

	const result = await createBundle(parsedBody.input);
	if (!result.ok) {
		return NextResponse.json(
			{ error: "course_not_found", missingCourseIds: result.missingCourseIds },
			{ status: 400 },
		);
	}

	return NextResponse.json({ bundle: result.bundle }, { status: 201 });
}
