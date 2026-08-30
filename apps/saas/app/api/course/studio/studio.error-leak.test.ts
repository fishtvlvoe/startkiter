import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Red-light（coupon-security-fixes / task 4.1）：
 * studio catch 不得把 Prisma／內部例外字串塞進 JSON response。
 * 現行回傳 details: String(error)，會外洩。
 */

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	VideoProvider: {},
	db: {
		course: {
			create: vi.fn(),
			delete: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		chapter: {
			findUnique: vi.fn(),
			count: vi.fn(),
			create: vi.fn(),
		},
		lesson: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		courseInstructor: {
			findUnique: vi.fn(),
		},
		courseVideoWatermarkSetting: {
			upsert: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/api/modules/course/lib/video-resolver", () => ({
	resolveVideoSource: vi.fn(),
}));

vi.mock("@startkiter/course", () => ({
	inspectMdxSource: vi.fn(),
}));

vi.mock("@startkiter/platform", () => ({
	getClientIp: vi.fn(),
	recordAdminAction: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { COURSE_STUDIO_ERROR_CODES } from "@startkiter/api/modules/course/errors";
import { db } from "@startkiter/database";

import { POST } from "./route";

describe("Course Studio API error response must not leak internals", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { ipAddress: "203.0.113.12" },
			user: { id: "operator-01", email: "operator@example.com" },
		} as never);
	});

	it("hides Prisma/internal exception strings from the 500 JSON body", async () => {
		vi.mocked(db.course.create).mockRejectedValue(
			new Error(
				"PrismaClientKnownRequestError: Invalid `prisma.course.create()` invocation: Unique constraint failed on the fields: (`slug`)",
			),
		);

		const response = await POST(
			new Request("http://localhost/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "create_course",
					payload: { title: "洩漏測試", slug: "leak-test", description: "x" },
				}),
			}),
		);

		expect(response.status).toBe(500);
		const body = (await response.json()) as Record<string, unknown>;
		const serialized = JSON.stringify(body);

		expect(body.error).toBe(COURSE_STUDIO_ERROR_CODES.INTERNAL_ERROR);
		expect(serialized).not.toMatch(/Prisma|prisma\.|Unique constraint|Invalid `/i);
		expect(body).not.toHaveProperty("details");
	});
});
