import { NextResponse } from "next/server";

function returnRedirect(request: Request) {
	const base = process.env.BETTER_AUTH_URL || new URL(request.url).origin;
	// 303：避免把 PAYUNi 的 POST method 帶進結果頁（307 會保留 method）
	return NextResponse.redirect(new URL("/checkout-return?status=returned", base), 303);
}

/** PAYUNi 瀏覽器 return；履約以 notify 為準。 */
export async function POST(request: Request) {
	return returnRedirect(request);
}

export async function GET(request: Request) {
	return returnRedirect(request);
}
