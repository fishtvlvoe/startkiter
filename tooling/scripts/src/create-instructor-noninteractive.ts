import { auth } from "@startkiter/auth";
import { createUser, createUserAccount, getUserByEmail } from "@startkiter/database";
import { logger } from "@startkiter/logs";

async function main() {
	const email = "sr01-instructor-test@startkiter.local";
	const name = "SR01 講師測試";
	const password = "TestInstructor2026!";

	const existing = await getUserByEmail(email);
	if (existing) {
		logger.info(`已存在：${email}`);
		return;
	}

	const authContext = await auth.$context;
	const hashedPassword = await authContext.password.hash(password);

	const user = await createUser({
		email,
		name,
		role: "instructor",
		emailVerified: true,
		onboardingComplete: true,
	});

	if (!user) {
		logger.error("建立失敗");
		return;
	}

	await createUserAccount({
		userId: user.id,
		providerId: "credential",
		accountId: user.id,
		hashedPassword,
	});

	logger.info(`建立完成：${email} / ${password}`);
}

main();
