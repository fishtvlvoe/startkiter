import { readFileSync } from "node:fs";

import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const coursePackCreate = vi.hoisted(() => vi.fn());
const coursePackUpdateMany = vi.hoisted(() => vi.fn());
const transaction = vi.hoisted(() => vi.fn());

vi.mock("@startkiter/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		$transaction: transaction,
		coursePack: {
			create: coursePackCreate,
			updateMany: coursePackUpdateMany,
		},
	},
}));

import { auth } from "@startkiter/auth";

import { importCoursePack } from "./import-course-pack";

const fixture = JSON.parse(
	readFileSync(
		"/Users/fishtv/Development/A-神系列/Awesome-Koson/src/fixtures/saas-payment-course-pack.json",
		"utf8",
	),
);

const operatorSession = {
	session: { id: "session-1", userId: "operator-1" },
	user: { id: "operator-1", email: "operator@example.com", role: "user" },
};

describe("course.importCoursePack", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue(operatorSession as never);
		coursePackUpdateMany.mockResolvedValue({ count: 0 });
		coursePackCreate.mockImplementation(async ({ data }) => ({
			id: data.id,
			sourcePackId: data.sourcePackId,
			title: data.title,
			importedAt: new Date("2026-08-25T06:00:00.000Z"),
		}));
		transaction.mockImplementation(async (callback) =>
			callback({
				coursePack: {
					create: coursePackCreate,
					updateMany: coursePackUpdateMany,
				},
			}),
		);
	});

	it("persists a valid Course Pack and its missions", async () => {
		await expect(call(importCoursePack, { envelope: fixture }, { context: { headers: new Headers() } })).resolves.toEqual({
			id: expect.any(String),
			sourcePackId: "saas-payment-mvp",
			title: "用 AI 建立自己的第一個 SaaS 收款系統",
			missionCount: 1,
			importedAt: "2026-08-25T06:00:00.000Z",
		});

		expect(coursePackUpdateMany).toHaveBeenCalledWith({
			where: { sourcePackId: "saas-payment-mvp", status: "active" },
			data: { status: "superseded" },
		});
		expect(coursePackCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				sourcePackId: "saas-payment-mvp",
				status: "active",
				importedBy: "operator-1",
				missions: {
					create: [expect.objectContaining({
						missionId: "webhook-01",
						title: "安全接住第一筆付款",
						goal: "讓測試付款建立訂單",
						sortOrder: 0,
						missionData: fixture.course_pack.missions[0],
					})],
				},
			}),
		});
	});

	it("rejects invalid envelopes without writing to the database", async () => {
		const invalid = structuredClone(fixture);
		delete invalid.course_pack.missions[0].evaluator;

		await expect(call(importCoursePack, { envelope: invalid }, { context: { headers: new Headers() } })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			data: { errors: expect.arrayContaining([expect.objectContaining({ path: "course_pack.missions.0.evaluator" })]) },
		});

		expect(transaction).not.toHaveBeenCalled();
	});

	it("rejects a non-operator without writing to the database", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { id: "session-2", userId: "teacher-1" },
			user: { id: "teacher-1", email: "teacher@example.com", role: "user" },
		} as never);

		await expect(call(importCoursePack, { envelope: fixture }, { context: { headers: new Headers() } })).rejects.toMatchObject({
			code: "FORBIDDEN",
		});

		expect(transaction).not.toHaveBeenCalled();
	});

	it("supersedes the active version when importing the same source id again", async () => {
		await call(importCoursePack, { envelope: fixture }, { context: { headers: new Headers() } });
		await call(importCoursePack, { envelope: fixture }, { context: { headers: new Headers() } });

		expect(coursePackUpdateMany).toHaveBeenCalledTimes(2);
		expect(coursePackCreate).toHaveBeenCalledTimes(2);
		expect(coursePackCreate.mock.calls[0][0].data.id).not.toBe(coursePackCreate.mock.calls[1][0].data.id);
	});
});
