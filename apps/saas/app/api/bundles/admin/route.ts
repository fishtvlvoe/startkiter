import { auth } from "@startkiter/auth";
import { listAllBundles } from "@startkiter/bundles";
import { db } from "@startkiter/database";
import { NextResponse } from "next/server";

import { operatorHttpStatus, type OperatorSession } from "../../../../lib/operator";

function getOperatorStatus(session: OperatorSession) {
	return operatorHttpStatus(session, process.env.ADMIN_EMAIL);
}

/**
 * `GET /api/bundles/admin`：operator 專用，後台管理頁用。
 * 回傳全部 Bundle（含 draft／archived）＋現有課程目錄（id/title，供表單的 courseIds 多選）。
 */
export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const status = getOperatorStatus(session);
	if (status === 401) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	}
	if (status === 403) {
		return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
	}

	const [bundles, courses] = await Promise.all([
		listAllBundles(),
		db.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
	]);
	return NextResponse.json({ bundles, courses });
}
