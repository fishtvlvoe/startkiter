import { render } from "react-email";

import { CourseWelcome, type CourseLifecycleEmailProps } from "../emails/CourseWelcome";
import { renderWelcomeEmailFromBlocks } from "./welcome-email-render";

function escapeMarkdownHtml(source: string): string {
	return source.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type RenderCourseWelcomeEmailInput = CourseLifecycleEmailProps & {
	contentJson?: string | null;
	courseUrl?: string;
	brandColor?: string;
	subject?: string;
};

export async function renderCourseWelcomeEmail(props: RenderCourseWelcomeEmailInput) {
	if (props.contentJson) {
		return renderWelcomeEmailFromBlocks(props.contentJson, {
			userName: props.userName,
			courseName: props.courseName,
			courseUrl: props.courseUrl ?? "",
			brandColor: props.brandColor,
			subject: props.subject,
		});
	}

	const email = CourseWelcome({
		userName: props.userName,
		courseName: props.courseName,
		markdown: escapeMarkdownHtml(props.markdown),
	});

	return {
		html: await render(email),
		text: await render(email, { plainText: true }),
	};
}
