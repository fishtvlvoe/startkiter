export {
	CHATWOOT_SIGNATURE_HEADER,
	CHATWOOT_TIMESTAMP_HEADER,
	createChatwootWebhookSignature,
	verifyChatwootWebhookSignature,
} from "./src/chatwoot-signature";
export { parseChatwootWebhookPayload } from "./src/chatwoot-payload";
export type { ChatwootContactHints, SupportTicketChannel } from "./src/chatwoot-payload";
export {
	AI_SUGGESTION_LABEL,
	BILLING_AUTO_REPLY,
	COOLIFY_UNAVAILABLE_INTERNAL_NOTE,
	DNS_AUTO_REPLY,
	NO_DEPLOYMENT_INTERNAL_NOTE,
	RESOLUTION_CONFIRM_PROMPT,
	detectKnownIssue,
	formatRemediationNote,
	runCopilot,
} from "./src/copilot";
export type {
	CoolifyLogProbe,
	CoolifyReaders,
	CopilotDeployment,
	CopilotResult,
	CopilotTicket,
	Diagnosis,
	GenerateDiagnosis,
	KnownIssue,
} from "./src/copilot";
export { defaultGenerateDiagnosis } from "./src/generate-diagnosis";
export {
	ForbiddenTicketStatusTransitionError,
	applyTicketStatusTransition,
} from "./src/ticket-status";
export type { SupportTicketStatus, TicketStatusActor } from "./src/ticket-status";
