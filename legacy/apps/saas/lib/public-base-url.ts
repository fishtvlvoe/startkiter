/**
 * 結帳／OAuth 對外 origin：必須是合法 URL，正式站需 https。
 * 本機允許 http://localhost 與 http://127.0.0.1。
 */
export function resolvePublicBaseUrl(raw: string | undefined | null): string | null {
	const trimmed = raw?.trim();
	if (!trimmed) {
		return null;
	}

	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		return null;
	}

	const host = url.hostname.toLowerCase();
	const isLocalHost = host === "localhost" || host === "127.0.0.1";
	if (url.protocol === "https:") {
		// ok
	} else if (url.protocol === "http:" && isLocalHost) {
		// ok for local dogfood
	} else {
		return null;
	}

	url.hash = "";
	url.search = "";
	const path = url.pathname.replace(/\/+$/, "");
	url.pathname = path === "/" ? "" : path;
	return url.origin + (url.pathname === "/" ? "" : url.pathname);
}
