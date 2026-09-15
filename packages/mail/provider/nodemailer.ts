import nodemailer from "nodemailer";

import { config } from "../config";
import { rejectWhenAborted } from "../lib/abort";
import type { SendEmailHandler } from "../types";

export const send: SendEmailHandler = async ({
	to,
	from,
	subject,
	cc,
	bcc,
	replyTo,
	text,
	html,
	signal,
}) => {
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST as string,
		port: Number.parseInt(process.env.SMTP_PORT || "587", 10),
		secure: process.env.SMTP_SECURE === "true",
		auth: {
			user: process.env.SMTP_USER as string,
			pass: process.env.SMTP_PASS as string,
		},
	});

	// nodemailer 無法真正 abort socket；signal abort 時至少 reject 結束 await
	await rejectWhenAborted(
		transporter.sendMail({
			to,
			from: from ?? config.mailFrom,
			cc,
			bcc,
			replyTo,
			subject,
			text,
			html,
		}),
		signal,
	);
};
