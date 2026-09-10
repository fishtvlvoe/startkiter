import { logger } from "@startkiter/logs";

import { config, type Locale } from "../config";
import type { mailTemplates } from "../emails";
import { send } from "../provider";
import type { TemplateId } from "./templates";
import { getTemplate } from "./templates";

export async function sendEmail<T extends TemplateId>(
	params: {
		to: string;
		from?: string;
		locale?: Locale;
		/** 寄送失敗時回呼 provider 原始錯誤（sendEmail 仍回傳 false） */
		onError?: (error: unknown) => void;
	} & (
		| {
				templateId: T;
				context: Omit<Parameters<(typeof mailTemplates)[T]>[0], "locale" | "translations">;
		  }
		| {
				subject: string;
				text?: string;
				html?: string;
		  }
	),
) {
	const { to, from, locale = config.defaultLocale as Locale, onError } = params;

	let html: string;
	let text: string;
	let subject: string;

	if ("templateId" in params) {
		const { templateId, context } = params;
		const template = await getTemplate({
			templateId,
			context,
			locale,
		});
		subject = template.subject;
		text = template.text;
		html = template.html;
	} else {
		subject = params.subject;
		text = params.text ?? "";
		html = params.html ?? "";
	}

	try {
		await send({
			to,
			from,
			subject,
			text,
			html,
		});
		return true;
	} catch (e) {
		logger.error(e);
		onError?.(e);
		return false;
	}
}
