"use server";

import {
	getEmailSettingsSummary,
	saveEmailSettings,
	sendTestEmail,
	type EmailSettingsSummary,
	type SendTestEmailResult,
	type StoredEmailSettings,
} from "@startkiter/mail";

import { requireGlobalAdmin } from "../../../../../../lib/admin-access";

export type SaveEmailSettingsActionResult =
	| { ok: true; summary: EmailSettingsSummary }
	| { ok: false; error: string };

export async function saveEmailSettingsAction(
	input: Partial<StoredEmailSettings>,
): Promise<SaveEmailSettingsActionResult> {
	const session = await requireGlobalAdmin();
	const result = await saveEmailSettings(input, session?.user?.id ?? null);
	if (!result.ok) {
		return { ok: false, error: result.error };
	}
	const summary = await getEmailSettingsSummary();
	return { ok: true, summary };
}

export async function sendTestEmailAction(to: string): Promise<SendTestEmailResult> {
	await requireGlobalAdmin();
	return sendTestEmail(to);
}

export async function getEmailSettingsSummaryAction(): Promise<EmailSettingsSummary> {
	await requireGlobalAdmin();
	return getEmailSettingsSummary();
}
