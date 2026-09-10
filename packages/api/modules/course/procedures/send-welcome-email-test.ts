import { ORPCError } from "@orpc/server";
import { db } from "@startkiter/database";
import { renderCourseWelcomeEmail, sendEmail } from "@startkiter/mail";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";

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

const input = z.object({
	courseId: z.string().trim().min(1),
	toEmail: z.string().trim().email(),
});

export const sendWelcomeEmailTest = courseOperatorProcedure
	.route({
		method: "POST",
		path: "/course/email-settings/welcome/test",
		tags: ["Course email"],
		summary: "Send a test welcome email to an arbitrary address",
	})
	.input(input)
	.handler(async ({ input: values }) => {
		const [setting, course] = await Promise.all([
			db.courseWelcomeEmail.findUnique({ where: { courseId: values.courseId } }),
			db.course.findUnique({
				where: { id: values.courseId },
				select: { id: true, title: true, slug: true },
			}),
		]);

		if (!course) throw new ORPCError("NOT_FOUND");
		if (!setting) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Course has no welcome email template",
			});
		}

		const sampleValues = {
			userName: "測試學員",
			courseName: course.title,
			courseUrl: `${baseUrl()}/course/${encodeURIComponent(course.slug)}`,
		} satisfies Record<TemplateVariable, string>;

		const subject = safeSubject(interpolateTemplate(setting.subjectTemplate, sampleValues));

		const rendered = setting.contentJson
			? await renderCourseWelcomeEmail({
					userName: sampleValues.userName,
					courseName: sampleValues.courseName,
					markdown: setting.markdownTemplate,
					contentJson: setting.contentJson,
					courseUrl: sampleValues.courseUrl,
					subject,
				})
			: await renderCourseWelcomeEmail({
					userName: sampleValues.userName,
					courseName: sampleValues.courseName,
					markdown: interpolateTemplate(setting.markdownTemplate, sampleValues),
					contentJson: null,
					courseUrl: sampleValues.courseUrl,
					subject,
				});

		try {
			let providerError: unknown = null;
			const sent = await sendEmail({
				to: values.toEmail,
				locale: "zh-tw",
				subject,
				html: rendered.html,
				text: rendered.text,
				onError: (error) => {
					providerError = error;
				},
			});
			if (!sent) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: providerError ? errorMessage(providerError) : "Email provider rejected delivery",
				});
			}
		} catch (error) {
			if (error instanceof ORPCError) throw error;
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: errorMessage(error),
			});
		}

		return {
			ok: true as const,
			toEmail: values.toEmail,
			subject,
		};
	});
