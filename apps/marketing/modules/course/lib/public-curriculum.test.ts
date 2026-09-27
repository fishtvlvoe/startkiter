import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetCachedPublishedCourse } = vi.hoisted(() => ({
	mockGetCachedPublishedCourse: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/published-content-cache", () => ({
	getCachedPublishedCourse: mockGetCachedPublishedCourse,
}));

vi.mock("@config", () => ({
	config: {
		saasUrl: "http://localhost:3000",
	},
}));

import { fetchPublishedCourse } from "./public-curriculum";

describe("fetchPublishedCourse (官網課綱資料來源共用)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("優先呼叫與教室、課程首頁共用的底層函式 getCachedPublishedCourse", async () => {
		const mockCourse = {
			id: "course-marketing-1",
			slug: "marketing-course",
			title: "電馭學院",
			description: "完整開站指南",
			chapters: [
				{
					id: "chap-1",
					title: "第一章",
					order: 0,
					lessons: [
						{
							id: "les-1",
							slug: "les-1",
							title: "單元一",
							isFreePreview: true,
							videoDuration: "05:00",
							order: 0,
							chapterId: "chap-1",
						},
					],
				},
			],
		};

		mockGetCachedPublishedCourse.mockResolvedValueOnce(mockCourse);

		const result = await fetchPublishedCourse();

		expect(mockGetCachedPublishedCourse).toHaveBeenCalledTimes(1);
		expect(result).toEqual(mockCourse);
	});
});
