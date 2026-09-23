import { db, getUserByEmail } from "@startkiter/database";
import { logger } from "@startkiter/logs";

async function main() {
	const email = "sr01-instructor-test@startkiter.local";
	const user = await getUserByEmail(email);
	if (!user) {
		logger.error(`找不到使用者：${email}`);
		return;
	}

	await db.order.create({
		data: {
			orderNo: `TEST-SR01-${Date.now()}`,
			userId: user.id,
			sku: "course-lifetime",
			amount: 0,
			status: "paid",
			paymentGateway: "payuni",
			courseAccess: true,
			paidAt: new Date(),
		},
	});

	logger.info(`已授予課程權限：${email}`);
}

main();
