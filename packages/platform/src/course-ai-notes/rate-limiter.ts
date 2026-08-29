type RateLimitState = Map<string, number[]>;

const callsByInstructor: RateLimitState = new Map();

export function checkRateLimit(
	instructorId: string,
	limit = 10,
	windowMs = 60_000,
): { allowed: boolean; retryAfterMs?: number } {
	const now = Date.now();
	const recentCalls = (callsByInstructor.get(instructorId) ?? []).filter((timestamp) => now - timestamp < windowMs);

	if (recentCalls.length >= limit) {
		const oldestCall = recentCalls[0] ?? now;
		return {
			allowed: false,
			retryAfterMs: Math.max(1, oldestCall + windowMs - now),
		};
	}

	recentCalls.push(now);
	callsByInstructor.set(instructorId, recentCalls);
	return { allowed: true };
}
