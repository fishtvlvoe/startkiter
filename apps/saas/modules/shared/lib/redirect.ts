const INTERNAL_REDIRECT_ORIGIN = "https://saas.invalid";

export function getSafeRedirectPath(redirectTo: string | null | undefined, fallback = "/"): string {
	return normalizeInternalPath(redirectTo) ?? normalizeInternalPath(fallback) ?? "/";
}

/**
 * 登入後回跳：優先讀 `next`（買家頁面慣例），沒有再讀 `redirectTo`（邀請／既有流程）。
 */
export function getLoginReturnPath(
	searchParams: Pick<URLSearchParams, "get">,
	fallback = "/",
): string {
	return getSafeRedirectPath(
		searchParams.get("next") ?? searchParams.get("redirectTo"),
		fallback,
	);
}

/** 未登入時導向登入頁，並用 `next` 帶上原本要去的站內路徑。 */
export function buildLoginRedirectUrl(nextPath?: string | null): string {
	const safe = nextPath ? normalizeInternalPath(nextPath) : null;
	if (!safe) {
		return "/login";
	}
	return `/login?next=${encodeURIComponent(safe)}`;
}

function normalizeInternalPath(path: string | null | undefined): string | null {
	if (!path?.startsWith("/")) {
		return null;
	}

	try {
		const url = new URL(path, INTERNAL_REDIRECT_ORIGIN);
		const normalizedPath = `${url.pathname}${url.search}${url.hash}`;

		if (url.origin !== INTERNAL_REDIRECT_ORIGIN || normalizedPath.startsWith("//")) {
			return null;
		}

		return normalizedPath;
	} catch {
		return null;
	}
}
