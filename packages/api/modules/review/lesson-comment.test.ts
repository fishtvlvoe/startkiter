import { describe, expect, it } from "vitest";

import { serializeLessonCommentForViewer } from "./lesson-comment";

describe("anonymous lesson comment identity", () => {
	const comment = {
		id: "comment-1",
		lessonId: "lesson-1",
		userId: "real-author-id",
		content: "這段很有幫助。",
		isAnonymous: true,
		isRead: false,
		deletedAt: null,
		createdAt: new Date("2026-08-24T00:00:00.000Z"),
	};

	it("hides the real author from learners while retaining it for operators", () => {
		expect(serializeLessonCommentForViewer(comment, "learner")).not.toHaveProperty("userId");
		expect(serializeLessonCommentForViewer(comment, "operator")).toMatchObject({ userId: "real-author-id" });
	});
});
