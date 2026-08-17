import { MVP_SKU } from "@startkiter/payments/constants";

export type CourseAccessOrderRow = {
	sku: string;
	courseAccess: boolean;
};

export type CourseAccessReader = {
	findOrdersForUser: (userId: string) => Promise<CourseAccessOrderRow[]>;
};

/** Entitlement：至少一筆 sku=startkiter-mvp 且 courseAccess=true。 */
export async function canAccessCourse(userId: string, reader: CourseAccessReader): Promise<boolean> {
	if (!userId) {
		return false;
	}
	const rows = await reader.findOrdersForUser(userId);
	return rows.some((row) => row.sku === MVP_SKU && row.courseAccess === true);
}
