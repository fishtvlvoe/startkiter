import { NextResponse, type NextRequest } from "next/server";

/**
 * 把目前請求路徑塞進 request header，讓 server layout 未登入導向 /login 時能帶上 ?next=。
 */
export function middleware(request: NextRequest) {
	const requestHeaders = new Headers(request.headers);
	const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
	requestHeaders.set("x-pathname", path);

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
