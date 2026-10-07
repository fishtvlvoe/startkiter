import nodemailer from "nodemailer";

import { config } from "../config";
import { rejectWhenAborted } from "../lib/abort";
import type { SendEmailHandler } from "../types";

export type SmtpCredentials = {
	host?: string;
	port?: number;
	user?: string;
	pass?: string;
	secure?: boolean;
};

export function createSmtpSender(credentials?: SmtpCredentials): SendEmailHandler {
	return async ({
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
		const host = credentials?.host ?? (process.env.SMTP_HOST as string);
		const port =
			credentials?.port ?? Number.parseInt(process.env.SMTP_PORT || "587", 10);
		const secure =
			credentials?.secure !== undefined
				? credentials.secure
				: process.env.SMTP_SECURE === "true";
		const user = credentials?.user ?? (process.env.SMTP_USER as string);
		const pass = credentials?.pass ?? (process.env.SMTP_PASS as string);

		const transporter = nodemailer.createTransport({
			host,
			port,
			secure,
			auth: {
				user,
				pass,
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
}

export const createNodemailerSender = createSmtpSender;

export const send: SendEmailHandler = async (params) => {
	return createSmtpSender()(params);
};
