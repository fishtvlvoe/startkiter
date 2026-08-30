const hits = new Map<string, { count: number; windowStart: number }>();

/**
 * Coolify / Traefik 會把真實連線 IP append 到 X-Forwarded-For 最右側。
 * 最左側（含整串）可被客戶端偽造；rate-limit 只信任最右側。
 */
export function resolveTrustedClientIp(forwardedFor: string | null | undefined): string {
	if (!forwardedFor || forwardedFor.trim() === "") {
		return "unknown";
	}

	const parts = forwardedFor
		.split(",")
		.map((part) => part.trim())
		.filter((part) => part.length > 0);

	return parts[parts.length - 1] ?? "unknown";
}

/**
 * 最小可用版本的固定窗口 rate limit（無既有機制可沿用，見 tasks.md 12.1）。
 * 單一 Node process 記憶體內計數，重啟即歸零；v1 範圍夠用，之後若要跨 instance 共享再換 Redis。
 */
export function checkRateLimit(
	identifier: string,
	opts: { limit: number; windowMs: number } = { limit: 10, windowMs: 60_000 },
): boolean {
	const now = Date.now();
	const entry = hits.get(identifier);

	if (!entry || now - entry.windowStart >= opts.windowMs) {
		hits.set(identifier, { count: 1, windowStart: now });
		return true;
	}

	if (entry.count >= opts.limit) {
		return false;
	}

	entry.count += 1;
	return true;
}
