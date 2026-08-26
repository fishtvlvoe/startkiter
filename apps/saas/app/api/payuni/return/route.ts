import { PayUniOneTimeGateway } from "@startkiter/payments";
import { NextResponse } from "next/server";

import { loadPayUniCredentials } from "../../../../lib/orders";

function returnRedirect(request: Request, params?: { orderNo?: string; status?: "returned" | "failed" }) {
	const base = process.env.BETTER_AUTH_URL || new URL(request.url).origin;
	// 303：避免把 PAYUNi 的 POST method 帶進結果頁（307 會保留 method）
	const target = new URL("/checkout-return", base);
	if (params?.orderNo) target.searchParams.set("orderNo", params.orderNo);
	target.searchParams.set("status", params?.status ?? "returned");
	return NextResponse.redirect(target, 303);
}

/** PAYUNi 瀏覽器 return；履約以 notify 為準。 */
export async function POST(request: Request) {
	try {
		const credentials = await loadPayUniCredentials();
		if (!credentials) return returnRedirect(request, { status: "failed" });
		const contentType = request.headers.get("content-type") || "";
		let encryptInfo = "";
		let hashInfo = "";
		if (contentType.includes("application/json")) {
			const body = (await request.json()) as { EncryptInfo?: string; HashInfo?: string };
			encryptInfo = body.EncryptInfo || "";
			hashInfo = body.HashInfo || "";
		} else {
			const form = await request.formData();
			encryptInfo = String(form.get("EncryptInfo") || "");
			hashInfo = String(form.get("HashInfo") || "");
		}
		if (!encryptInfo || !hashInfo) return returnRedirect(request, { status: "failed" });

		const payload = new PayUniOneTimeGateway(credentials).verifyNotify(encryptInfo, hashInfo);
		const orderNo = typeof payload.MerTradeNo === "string" ? payload.MerTradeNo.trim() : "";
		if (!orderNo) return returnRedirect(request, { status: "failed" });
		return returnRedirect(request, { orderNo, status: payload.Status === "SUCCESS" ? "returned" : "failed" });
	} catch {
		return returnRedirect(request, { status: "failed" });
	}
}

export async function GET(request: Request) {
	const orderNo = new URL(request.url).searchParams.get("orderNo")?.trim() || undefined;
	return returnRedirect(request, { orderNo });
}
