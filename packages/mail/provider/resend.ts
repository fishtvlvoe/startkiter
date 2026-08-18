import { Resend } from "resend";

import { config } from "../config";
import type { SendEmailHandler } from "../types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const send: SendEmailHandler = async ({
	to,
	from,
	subject,
	cc,
	bcc,
	replyTo,
	html,
	text,
}) => {
	if (!resend) {
		throw new Error("RESEND_API_KEY is required to send email with the Resend provider");
	}

	await resend.emails.send({
		from: from ?? config.mailFrom,
		to: [to],
		cc,
		bcc,
		replyTo,
		subject,
		html,
		text,
	});
};
