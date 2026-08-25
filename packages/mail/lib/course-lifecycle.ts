import { render } from "react-email";

import { CourseWelcome, type CourseLifecycleEmailProps } from "../emails/CourseWelcome";

function escapeMarkdownHtml(source: string): string {
	return source.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function renderCourseWelcomeEmail(props: CourseLifecycleEmailProps) {
	const email = CourseWelcome({
		...props,
		markdown: escapeMarkdownHtml(props.markdown),
	});

	return {
		html: await render(email),
		text: await render(email, { plainText: true }),
	};
}
