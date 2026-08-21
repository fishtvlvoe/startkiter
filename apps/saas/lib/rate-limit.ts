const hits = new Map<string, { count: number; windowStart: number }>();

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
