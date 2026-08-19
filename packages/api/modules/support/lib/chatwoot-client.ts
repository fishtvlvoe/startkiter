export type ChatwootMessageClient = {
	postPublicReply: (conversationId: number, content: string) => Promise<void>;
	postInternalNote: (conversationId: number, content: string) => Promise<void>;
	markForHuman: (conversationId: number, label?: string) => Promise<void>;
};

const HUMAN_FOLLOW_UP_LABEL = "needs-human";

async function chatwootRequest(path: string, init: RequestInit): Promise<void> {
	const baseUrl = process.env.CHATWOOT_BASE_URL?.replace(/\/+$/, "");
	const token = process.env.CHATWOOT_API_ACCESS_TOKEN?.trim();
	const accountId = process.env.CHATWOOT_ACCOUNT_ID?.trim();
	if (!baseUrl || !token || !accountId) {
		return;
	}

	await fetch(`${baseUrl}/api/v1/accounts/${accountId}${path}`, {
		...init,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			api_access_token: token,
			...(init.headers ?? {}),
		},
	});
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
};
