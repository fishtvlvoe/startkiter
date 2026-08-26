import { Heading, Markdown } from "react-email";

import Wrapper from "../components/Wrapper";

export interface CourseLifecycleEmailProps {
	userName: string;
	courseName: string;
	markdown: string;
}

/**
 * Markdown is rendered by react-email. Raw HTML delimiters are escaped before
 * the renderer sees them so operator-authored content remains Markdown-only.
 */
export function CourseWelcome({ userName, courseName, markdown }: CourseLifecycleEmailProps) {
	return (
		<Wrapper>
			<Heading className="mt-0 text-xl font-semibold">{courseName}</Heading>
			<Markdown>{markdown}</Markdown>
			<p className="text-sm text-muted-foreground">收件人：{userName}</p>
		</Wrapper>
	);
}

export default CourseWelcome;
