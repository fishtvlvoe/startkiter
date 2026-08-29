import { checkRateLimit } from "./rate-limiter";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("checkRateLimit", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("allows the first ten calls and rejects the eleventh with a retry delay", () => {
		const instructorId = "instructor-rate-limit";

		for (let call = 1; call <= 10; call += 1) {
			expect(checkRateLimit(instructorId, 10, 60_000)).toEqual({ allowed: true });
		}

		const result = checkRateLimit(instructorId, 10, 60_000);

		expect(result.allowed).toBe(false);
		expect(result.retryAfterMs).toBeGreaterThan(0);
		expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
	});

	it("resets after the rolling window expires", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
		const instructorId = "instructor-window-reset";

		for (let call = 1; call <= 10; call += 1) {
			checkRateLimit(instructorId, 10, 60_000);
		}
		expect(checkRateLimit(instructorId, 10, 60_000).allowed).toBe(false);

		vi.advanceTimersByTime(60_001);

		expect(checkRateLimit(instructorId, 10, 60_000)).toEqual({ allowed: true });
	});
});
