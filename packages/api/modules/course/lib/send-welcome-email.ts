import { db } from "@startkiter/database";
import { renderCourseWelcomeEmail, sendEmail } from "@startkiter/mail";
import { logger } from "@startkiter/logs";
import { MVP_SKU } from "@startkiter/payments/constants";

const TEMPLATE_VARIABLES = ["userName", "courseName", "courseUrl"] as const;
type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

function baseUrl(): string {
	return (process.env.NEXT_PUBLIC_SAAS_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

function safeSubject(value: string): string {
	return value.replace(/[\r\n]+/g, " ").trim().slice(0, 998);
}

function safeTemplateValue(value: string): string {
	return value.replaceAll("\\", "\\\\").replace(/[\[\]()*_`#<>]/g, "\\$&");
}

function interpolateTemplate(source: string, values: Record<TemplateVariable, string>): string {
	return TEMPLATE_VARIABLES.reduce(
		(result, variable) => result.replaceAll(`{{${variable}}}`, safeTemplateValue(values[variable])),
		source,
	);
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed";
}

export async function sendWelcomeEmail(input: {
	userId: string;
	courseId: string;
	orderId?: string;
	subscriptionId?: string;
}): Promise<void> {
	try {
		const [setting, user, course] = await Promise.all([
			db.courseWelcomeEmail.findUnique({ where: { courseId: input.courseId } }),
			db.user.findUnique({ where: { id: input.userId }, select: { name: true, email: true, locale: true } }),
			db.course.findUnique({ where: { id: input.courseId }, select: { title: true, slug: true } }),
		]);

		if (!setting?.enabled || !user?.email || !course) return;

		const values = {
			userName: user.name || user.email,
			courseName: course.title,
			courseUrl: `${baseUrl()}/course/${encodeURIComponent(course.slug)}`,
		} satisfies Record<TemplateVariable, string>;
		const subject = safeSubject(interpolateTemplate(setting.subjectTemplate, values));
		const rendered = await renderCourseWelcomeEmail({
			userName: values.userName,
			courseName: values.courseName,
			markdown: interpolateTemplate(setting.markdownTemplate, values),
		});

		const delivery = await db.emailDeliveryLog.create({
			data: {
				type: "WELCOME_EMAIL",
				status: "PENDING",
				orderId: input.orderId,
				subscriptionId: input.subscriptionId,
				userId: input.userId,
				courseId: input.courseId,
				toEmail: user.email,
				subject,
			},
		});

		try {
			const sent = await sendEmail({
				to: user.email,
				locale: user.locale as Parameters<typeof sendEmail>[0]["locale"],
				subject,
				html: rendered.html,
				text: rendered.text,
			});
			await db.emailDeliveryLog.update({
				where: { id: delivery.id },
				data: sent
					? { status: "SENT", sentAt: new Date() }
					: { status: "FAILED", errorMessage: "Email provider rejected delivery" },
			});
		} catch (error) {
			await db.emailDeliveryLog.update({
				where: { id: delivery.id },
				data: { status: "FAILED", errorMessage: errorMessage(error) },
			}).catch(() => undefined);
			logger.error(error);
		}
	} catch (error) {
		logger.error(error);
	}
}

export async function sendWelcomeEmailsForOrder(orderId: string): Promise<void> {
	try {
		const order = await db.order.findUnique({
			where: { id: orderId },
			select: { userId: true, sku: true },
		});
		if (!order) return;

		let courseIds: string[] = [];
		if (order.sku === MVP_SKU) {
			const course = await db.course.findFirst({ where: { status: "PUBLISHED" }, select: { id: true } });
			if (course) courseIds = [course.id];
		} else {
			courseIds = (await db.bundle.findUnique({
				where: { id: order.sku },
				select: { courses: { select: { courseId: true } } },
			}))?.courses.map((course) => course.courseId) ?? [];
		}

		await Promise.all(courseIds.map((courseId) => sendWelcomeEmail({ userId: order.userId, courseId, orderId })));
	} catch (error) {
		logger.error(error);
	}
}

export { interpolateTemplate };
