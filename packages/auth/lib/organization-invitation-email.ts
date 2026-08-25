import { config as i18nConfig, type Locale } from "@startkiter/i18n";
import { sendEmail } from "@startkiter/mail";

export async function sendOrganizationInvitationEmail({
	email,
	id,
	organizationName,
	locale = i18nConfig.defaultLocale as Locale,
	baseUrl,
	existingUser,
}: {
	email: string;
	id: string;
	organizationName: string;
	locale?: Locale;
	baseUrl: string;
	existingUser: boolean;
}) {
	const url = new URL(existingUser ? "/login" : "/signup", baseUrl);
	url.searchParams.set("invitationId", id);
	url.searchParams.set("email", email);

	await sendEmail({
		to: email,
		templateId: "organizationInvitation",
		locale,
		context: {
			organizationName,
			url: url.toString(),
		},
	});
}
