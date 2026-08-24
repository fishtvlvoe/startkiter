import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
		bundle: { findUnique: vi.fn() },
		course: { findFirst: vi.fn(), findMany: vi.fn() },
		lesson: { findUnique: vi.fn() },
		lessonProgress: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
	order: { findFirst: vi.fn(), findMany: vi.fn() },
	courseSubscription: { findFirst: vi.fn() },
	courseInviteRedemption: { findUnique: vi.fn() },
		studioFolder: { findMany: vi.fn() },
	},
}));

vi.mock("@startkiter/course", () => ({
	canAccessCourseId: vi.fn(async (userId: string, courseId: string, reader: {
		findGrantedSkusForUser: (id: string) => Promise<string[]>;
		findBundleCourseIds: (sku: string) => Promise<string[] | null>;
	}) => {
		const skus = await reader.findGrantedSkusForUser(userId);
		for (const sku of skus) {
			const courseIds = await reader.findBundleCourseIds(sku);
			if (courseIds?.includes(courseId)) return true;
		}
		return false;
	}),
	inspectMdxSource: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { createPrismaBundleCourseAccessReader } from "./lib/course-access";
import { resolveVideoSource } from "./lib/video-resolver";
import { courseRouter } from "./router";

describe("Course Video Resolver (Fluent Player)", () => {
	it("correctly identifies Bunny Stream URLs", () => {
		const res = resolveVideoSource("https://iframe.mediadelivery.net/play/12345/bunny-demo");
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.provider).toBe("BUNNY");
			expect(res.sourceId).toBe("12345/bunny-demo");
		}
	});

	it("correctly identifies YouTube URLs", () => {
		const res = resolveVideoSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.provider).toBe("YOUTUBE");
			expect(res.sourceId).toBe("dQw4w9WgXcQ");
		}
	});

	it("correctly identifies Vimeo URLs", () => {
		const res = resolveVideoSource("https://vimeo.com/123456789");
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.provider).toBe("VIMEO");
			expect(res.sourceId).toBe("123456789");
		}
	});

	it("correctly identifies direct HTTPS MP4 URLs", () => {
		const res = resolveVideoSource("https://example.com/videos/lesson1.mp4");
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.provider).toBe("CUSTOM_MP4");
		}
	});

	it("rejects unknown or insecure HTTP URLs (fail-closed)", () => {
		const insecureRes = resolveVideoSource("http://example.com/video.mp4");
		expect(insecureRes.ok).toBe(false);

		const unknownRes = resolveVideoSource("https://unsupported-site.com/watch");
		expect(unknownRes.ok).toBe(false);
	});
});

const authenticatedSession = {
	session: { id: "session-1", userId: "buyer-a" },
	user: { id: "buyer-a", email: "buyer-a@example.com", role: "user" },
};

function paidLesson(courseId: string) {
	return {
		id: "lesson-paid",
		status: "PUBLISHED",
		isFreePreview: false,
		content: "# paid lesson",
		chapter: { courseId },
	};
}

describe("getLessonDetail bundle-aware access", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(authenticatedSession as never);
		vi.mocked(db.lesson.findUnique).mockResolvedValue(paidLesson("course-a") as never);
		vi.mocked(db.order.findFirst).mockResolvedValue({ id: "legacy-paid-order" } as never);
	});

	it("returns full lesson content for a course included in the buyer's bundle", async () => {
		vi.mocked(db.order.findMany).mockResolvedValue([{ sku: "bundle-a" }] as never);
		vi.mocked(db.bundle.findUnique).mockResolvedValue({ courses: [{ courseId: "course-a" }] } as never);

		const result = await call(
			courseRouter.getLessonDetail,
			{ lessonId: "lesson-paid" },
			{ context: { headers: new Headers(), user: authenticatedSession.user } as never },
		);

		expect(result.lesson.content).toBe("# paid lesson");
	});

	it("rejects a paid lesson outside the buyer's bundle", async () => {
		vi.mocked(db.order.findMany).mockResolvedValue([{ sku: "bundle-a" }] as never);
		vi.mocked(db.bundle.findUnique).mockResolvedValue({ courses: [{ courseId: "course-b" }] } as never);

		await expect(
			call(
				courseRouter.getLessonDetail,
				{ lessonId: "lesson-paid" },
				{ context: { headers: new Headers(), user: authenticatedSession.user } as never },
			),
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("rejects an unauthenticated request for a non-preview lesson", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		await expect(
			call(
				courseRouter.getLessonDetail,
				{ lessonId: "lesson-paid" },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	it("allows an unauthenticated request for a free-preview lesson without bundle lookup", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			...paidLesson("course-a"),
			isFreePreview: true,
		} as never);

		const result = await call(
			courseRouter.getLessonDetail,
			{ lessonId: "lesson-preview" },
			{ context: { headers: new Headers() } },
		);

		expect(result.lesson.isFreePreview).toBe(true);
		expect(db.order.findMany).not.toHaveBeenCalled();
		expect(db.bundle.findUnique).not.toHaveBeenCalled();
	});

	it("uses the buyer-scoped order and bundle query shape", async () => {
		vi.mocked(db.order.findMany).mockResolvedValue([{ sku: "bundle-a" }] as never);
		vi.mocked(db.bundle.findUnique).mockResolvedValue({ courses: [{ courseId: "course-a" }] } as never);

		const reader = createPrismaBundleCourseAccessReader();

		await expect(reader.findGrantedSkusForUser("buyer-a")).resolves.toEqual(["bundle-a"]);
		await expect(reader.findBundleCourseIds("bundle-a")).resolves.toEqual(["course-a"]);
		expect(db.order.findMany).toHaveBeenCalledWith({
			where: { userId: "buyer-a", courseAccess: true },
			select: { sku: true },
		});
		expect(db.bundle.findUnique).toHaveBeenCalledWith({
			where: { id: "bundle-a" },
			include: { courses: true },
		});
	});

	it("reads only ACTIVE subscriptions for the requested course", async () => {
		vi.mocked(db.courseSubscription.findFirst).mockResolvedValue({ id: "subscription-1" } as never);
		const reader = createPrismaBundleCourseAccessReader();

		await expect(reader.hasActiveSubscription("buyer-a", "course-a")).resolves.toBe(true);
		expect(db.courseSubscription.findFirst).toHaveBeenCalledWith({
			where: { userId: "buyer-a", courseId: "course-a", status: "ACTIVE" },
			select: { id: true },
		});
	});

	it("reads redeemed course invites by the user-course unique key", async () => {
		vi.mocked(db.courseInviteRedemption.findUnique).mockResolvedValue({ id: "redemption-1" } as never);
		const reader = createPrismaBundleCourseAccessReader();

		await expect(reader.hasRedeemedInvite("buyer-a", "course-a")).resolves.toBe(true);
		expect(db.courseInviteRedemption.findUnique).toHaveBeenCalledWith({
			where: { userId_courseId: { userId: "buyer-a", courseId: "course-a" } },
			select: { id: true },
		});
	});
});
