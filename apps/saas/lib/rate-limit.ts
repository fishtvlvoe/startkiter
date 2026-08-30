const hits = new Map<string, { count: number; windowStart: number }>();

/** Coolify + Traefik 單層反向代理；代理架構變了要同步改 env。 */
const DEFAULT_TRUSTED_PROXY_COUNT = 1;

/**
 * 解析 TRUSTED_PROXY_COUNT。缺值／非負整數以外的字串都回退預設 1（fail closed 到已知拓樸）。
 * 設 0 = 完全不信任 X-Forwarded-For。
 */
export function getTrustedProxyCount(
	envValue: string | undefined = process.env.TRUSTED_PROXY_COUNT,
): number {
	if (envValue === undefined || envValue.trim() === "") {
		return DEFAULT_TRUSTED_PROXY_COUNT;
	}

	const parsed = Number.parseInt(envValue, 10);

	if (!Number.isFinite(parsed) || parsed < 0 || String(parsed) !== envValue.trim()) {
		return DEFAULT_TRUSTED_PROXY_COUNT;
	}

	return parsed;
}

/**
 * 依固定代理跳數解析 X-Forwarded-For 的可信 client IP。
 *
 * 每層可信代理會把「它看到的連線 IP」append 到鏈尾。從右往左數
 * `TRUSTED_PROXY_COUNT` 段，取那一段；左側客戶端可偽造的前綴一律忽略。
 *
 * 拓樸假設（預設 1）：流量一定經過 Coolify Traefik 再進 app。若 app 可被直接連到、
 * 或中間多加 CDN／代理卻沒改這個數字，判斷會錯。這不是 header 解析能獨自保證的。
 */
export function resolveTrustedClientIp(
	forwardedFor: string | null | undefined,
	trustedProxyCount: number = getTrustedProxyCount(),
): string {
	if (!forwardedFor || forwardedFor.trim() === "") {
		return "unknown";
	}

	if (trustedProxyCount <= 0) {
		return "unknown";
	}

	const parts = forwardedFor
		.split(",")
		.map((part) => part.trim())
		.filter((part) => part.length > 0);

	if (parts.length === 0) {
		return "unknown";
	}

	const index = Math.max(0, parts.length - trustedProxyCount);
	return parts[index] ?? "unknown";
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
