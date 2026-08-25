import { db } from "../client";

async function getOrganizationIdsForUser(userId: string) {
	const memberships = await db.member.findMany({
		where: { userId },
		select: { organizationId: true },
	});

	return memberships.map(({ organizationId }) => organizationId);
}

function accessScope(userId: string, organizationIds: string[]) {
	return {
		OR: [
			{ userId },
			...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
		],
	};
}

export async function getCourseAccessOrdersForUser(userId: string) {
	const organizationIds = await getOrganizationIdsForUser(userId);

	return db.order.findMany({
		where: {
			courseAccess: true,
			...accessScope(userId, organizationIds),
		},
		select: { sku: true, courseAccess: true },
	});
}

export async function getEligibleKitOrderForUser(userId: string, sku: string) {
	const organizationIds = await getOrganizationIdsForUser(userId);

	return db.order.findFirst({
		where: {
			sku,
			kitClaimEligible: true,
			...accessScope(userId, organizationIds),
		},
		select: { id: true, orderNo: true },
	});
}
