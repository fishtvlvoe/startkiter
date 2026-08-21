import type { SupportTicketChannel } from "@startkiter/support";

export type ChatwootMessageClient = {
	postPublicReply: (conversationId: number, content: string) => Promise<void>;
	postInternalNote: (conversationId: number, content: string) => Promise<void>;
	markForHuman: (conversationId: number, label?: string) => Promise<void>;
	createConversation?: (args: {
		channel: SupportTicketChannel;
		message: string;
		sourceId?: string;
		contactEmail?: string;
		contactName?: string;
		buyerDeploymentId?: string | null;
	}) => Promise<{ conversationId: number }>;
};

const HUMAN_FOLLOW_UP_LABEL = "needs-human";

async function chatwootRequest<T = void>(path: string, init: RequestInit): Promise<T | null> {
	const baseUrl = process.env.CHATWOOT_BASE_URL?.replace(/\/+$/, "");
	const token = process.env.CHATWOOT_API_ACCESS_TOKEN?.trim();
	const accountId = process.env.CHATWOOT_ACCOUNT_ID?.trim();
	if (!baseUrl || !token || !accountId) {
		return null;
	}

	const response = await fetch(`${baseUrl}/api/v1/accounts/${accountId}${path}`, {
		...init,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			api_access_token: token,
			...(init.headers ?? {}),
		},
	});

	if (!response.ok) {
		return null;
	}

	try {
		return (await response.json()) as T;
	} catch {
		return null;
	}
}

export const defaultChatwootMessageClient: ChatwootMessageClient = {
	async postPublicReply(conversationId, content) {
		await chatwootRequest(`/conversations/${conversationId}/messages`, {
			method: "POST",
			body: JSON.stringify({
				content,
				message_type: "outgoing",
				private: false,
			}),
		});
	},
	async postInternalNote(conversationId, content) {
		await chatwootRequest(`/conversations/${conversationId}/messages`, {
			method: "POST",
			body: JSON.stringify({
				content,
				message_type: "outgoing",
				private: true,
			}),
		});
	},
	async markForHuman(conversationId, label = HUMAN_FOLLOW_UP_LABEL) {
		await chatwootRequest(`/conversations/${conversationId}/labels`, {
			method: "POST",
			body: JSON.stringify({ labels: [label] }),
		});
	},
	async createConversation(args) {
		const inboxId = process.env.CHATWOOT_INBOX_ID;
		const res = await chatwootRequest<{ id: number }>(`/conversations`, {
			method: "POST",
			body: JSON.stringify({
				inbox_id: inboxId ? Number.parseInt(inboxId, 10) : undefined,
				source_id: args.sourceId,
				custom_attributes: {
					channel: args.channel,
					buyerDeploymentId: args.buyerDeploymentId,
				},
				message: {
					content: args.message,
				},
			}),
		});
		return {
			conversationId: res?.id ?? Math.floor(Date.now() / 1000),
		};
	},
};
