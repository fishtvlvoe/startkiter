export { sendEmail } from "./lib/send";
export { renderCourseWelcomeEmail } from "./lib/course-lifecycle";
export {
	blocksToPlainText,
	renderWelcomeEmailFromBlocks,
	sanitizeEmailHtml,
	assertHtmlSize,
	MAX_WELCOME_EMAIL_HTML_BYTES,
} from "./lib/welcome-email-render";
export {
	EMAIL_SETTINGS_ID,
	readEmailSettings,
	saveEmailSettings,
	sendTestEmail,
	getEmailSettingsSummary,
	clearEmailSettingsCache,
	getCachedEmailSettings,
	hasStoredCredential,
	getStoredProviderSender,
	resolveActiveProvider,
} from "./lib/email-settings";
export type {
	StoredEmailSettings,
	EmailSettingsSummary,
	EmailProviderType,
	SaveEmailSettingsResult,
	SendTestEmailResult,
} from "./lib/email-settings";

