import { NextResponse } from "next/server";
import { revokeKitGrantOnRefund } from "@startkiter/github-kit";

import {
	createConfiguredCollaboratorClient,
	createPrismaGrantStore,
	loadGithubKitRuntime,
} from "../../../../lib/github-kit";
import { findOrderByNo, markOrderRefundedInDb } from "../../../../lib/orders";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 內部退款標記 hook：需帶 x-startkiter-internal-token = INTERNAL_ORDER_REFUND_TOKEN。
 * 不是一般使用者 API。退款完成後嘗試撤銷 GitHub kit；GitHub 失敗不擋退款。
 */
export async function POST(request: Request) {
	const expected = process.env.INTERNAL_ORDER_REFUND_TOKEN?.trim();
	const provided = request.headers.get("x-startkiter-internal-token")?.trim();
	if (!expected || !provided || provided !== expected) {
		return NextResponse.json({ error: "forbidden" }, { status: 403 });
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

	const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";
	if (!orderNo) {
		return NextResponse.json({ error: "order_no_required" }, { status: 400 });
	}

	const existing = await findOrderByNo(orderNo);
	if (!existing) {
		return NextResponse.json({ error: "order_not_found" }, { status: 404 });
	}

	const updated = await markOrderRefundedInDb(orderNo);
	if (updated === 0) {
		return NextResponse.json({ error: "order_not_refundable" }, { status: 400 });
	}

	const grants = createPrismaGrantStore();
	const { config } = loadGithubKitRuntime();
	const collaborators = createConfiguredCollaboratorClient();
	let kitRevoke: Awaited<ReturnType<typeof revokeKitGrantOnRefund>> | {
		githubCalled: false;
		grantStatus: "failed" | "skipped";
		reason?: string;
	} | null = null;

	if (config && collaborators) {
		kitRevoke = await revokeKitGrantOnRefund({
			userId: existing.userId,
			config,
			grants,
			collaborators,
		});
	} else {
		// 設定缺失仍要可觀測：有 active grant 就標 failed，不要靜默跳過
		const active = await grants.findActiveByUserId(existing.userId);
		if (active.length === 0) {
			kitRevoke = { githubCalled: false, grantStatus: "skipped", reason: "no_active_grant" };
		} else {
			for (const g of active) {
				await grants.markStatus({
					userId: g.userId,
					org: g.org,
					repo: g.repo,
					status: "failed",
				});
			}
			kitRevoke = {
				githubCalled: false,
				grantStatus: "failed",
				reason: "github_kit_misconfigured",
			};
			console.error(
				"[github-kit] refund revoke skipped: misconfigured, marked grants failed",
				{ userId: existing.userId, count: active.length },
			);
		}
	}

	const latest = await findOrderByNo(orderNo);
	return NextResponse.json({
		orderNo: latest?.orderNo,
		status: latest?.status,
		courseAccess: latest?.courseAccess,
		kitClaimEligible: latest?.kitClaimEligible,
		kitRevoke,
	});
}
