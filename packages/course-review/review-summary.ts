import { db } from "@startkiter/database";

export interface CourseReviewSummary {
	averageRating: number;
	reviewCount: number;
}

export async function getCourseReviewSummary(courseId: string): Promise<CourseReviewSummary> {
	const aggregate = await db.courseReview.aggregate({
		where: { courseId, isVisible: true },
		_avg: { rating: true },
		_count: { _all: true },
	});

	return {
		averageRating: aggregate._avg.rating ?? 0,
		reviewCount: aggregate._count._all,
	};
}
