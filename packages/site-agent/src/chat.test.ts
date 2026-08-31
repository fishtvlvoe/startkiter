import { describe, expect, it, vi } from "vitest";

import { runSiteAgentChat } from "./chat";
import { createEchoProvider } from "./provider";
import { runAgentTool } from "./tools";
import { ALLOWED_TOOLS } from "./types";
import type { AgentDataAccess } from "./types";

function createAccess(): AgentDataAccess {
	return {
		async listOrdersForUser(userId) {
			if (userId === "user_a") {
				return [
					{
						orderNo: "SK-A",
						sku: "startkiter-mvp",
						status: "paid",
						amount: 8800,
						courseAccess: true,
						kitClaimEligible: true,
					},
				];
			}
			return [
				{
					orderNo: "SK-B",
					sku: "startkiter-mvp",
					status: "paid",
					amount: 8800,
					courseAccess: true,
					kitClaimEligible: false,
				},
			];
		},
		async listCourseProgressForUser(userId) {
			return {
				courseAccess: userId === "user_a",
				lessons: [
					{
						lessonId: "lesson_01",
						title: "Intro",
						status: "not_tracked",
					},
				],
			};
		},
	};
}

describe("ALLOWED_TOOLS", () => {
	it("contains exactly the two read-only self-scoped tools", () => {
		expect([...ALLOWED_TOOLS]).toEqual(["get_my_orders", "get_my_course_progress"]);
	});
});

describe("runAgentTool", () => {
	it("rejects unauthenticated", async () => {
		const spy = vi.fn();
		const result = await runAgentTool({
			userId: null,
			tool: "get_my_orders",
			data: {
				listOrdersForUser: spy,
				listCourseProgressForUser: spy,
			},
		});
		expect(result).toEqual({ ok: false, error: "unauthenticated" });
		expect(spy).not.toHaveBeenCalled();
	});

	it("rejects unknown tools", async () => {
		const result = await runAgentTool({
			userId: "user_a",
			tool: "delete_user_account",
			data: createAccess(),
		});
		expect(result).toEqual({ ok: false, error: "unknown_tool" });
	});

	it("does not accept write tools outside the allowlist", async () => {
		const spy = vi.fn();
		const result = await runAgentTool({
			userId: "user_a",
			tool: "refund_order",
			data: {
				listOrdersForUser: spy,
				listCourseProgressForUser: spy,
			},
		});
		expect(result).toEqual({ ok: false, error: "unknown_tool" });
		expect(spy).not.toHaveBeenCalled();
	});

	it("scopes orders to caller", async () => {
		const result = await runAgentTool({
			userId: "user_a",
			tool: "get_my_orders",
			data: createAccess(),
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			const data = result.data as { orders: Array<{ orderNo: string }> };
			expect(data.orders.map((o) => o.orderNo)).toEqual(["SK-A"]);
		}
	});

	it("scopes course progress to caller", async () => {
		const resultA = await runAgentTool({
			userId: "user_a",
			tool: "get_my_course_progress",
			data: createAccess(),
		});
		const resultB = await runAgentTool({
			userId: "user_b",
			tool: "get_my_course_progress",
			data: createAccess(),
		});
		expect(resultA.ok).toBe(true);
		expect(resultB.ok).toBe(true);
		if (resultA.ok && resultB.ok) {
			expect(resultA.data).toMatchObject({ courseAccess: true });
			expect(resultB.data).toMatchObject({ courseAccess: false });
		}
	});
});

describe("runSiteAgentChat", () => {
	it("returns 401 without session", async () => {
		const result = await runSiteAgentChat({
			userId: null,
			message: "hi",
			data: createAccess(),
			providerOverride: createEchoProvider(),
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 401,
			error: "authentication_required",
		});
	});

	it("returns 400 on empty message", async () => {
		const result = await runSiteAgentChat({
			userId: "user_a",
			message: "  ",
			data: createAccess(),
			providerOverride: createEchoProvider(),
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.httpStatus).toBe(400);
		}
	});

	it("returns 503 when only Gemini key is set (no silent echo)", async () => {
		const result = await runSiteAgentChat({
			userId: "user_a",
			message: "hi",
			data: createAccess(),
			env: { GEMINI_API_KEY: "fake" },
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 503,
			error: "provider_not_configured",
		});
	});

	it("returns assistant message with echo provider", async () => {
		const result = await runSiteAgentChat({
			userId: "user_a",
			message: "我的訂單？",
			data: createAccess(),
			providerOverride: createEchoProvider(),
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.assistantMessage).toContain("我的訂單？");
			expect(result.toolTraces.length).toBe(2);
			expect(result.toolTraces.map((trace) => trace.tool)).toEqual([
				"get_my_orders",
				"get_my_course_progress",
			]);
		}
	});
});
