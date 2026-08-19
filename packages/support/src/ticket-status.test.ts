import { describe, expect, it } from "vitest";

import { applyTicketStatusTransition, ForbiddenTicketStatusTransitionError } from "./ticket-status";

describe("applyTicketStatusTransition", () => {
	it("rejects AI setting status to RESOLVED", () => {
		expect(() =>
			applyTicketStatusTransition({
				from: "OPEN",
				to: "RESOLVED",
				actor: "AI",
			}),
		).toThrow(ForbiddenTicketStatusTransitionError);
	});

	it("allows AI to suggest resolution", () => {
		expect(
			applyTicketStatusTransition({
				from: "OPEN",
				to: "AI_SUGGESTED_RESOLVED",
				actor: "AI",
			}),
		).toBe("AI_SUGGESTED_RESOLVED");
	});

	it("allows buyer confirmation to resolve", () => {
		expect(
			applyTicketStatusTransition({
				from: "AI_SUGGESTED_RESOLVED",
				to: "RESOLVED",
				actor: "BUYER_CONFIRMED",
			}),
		).toBe("RESOLVED");
	});
});
