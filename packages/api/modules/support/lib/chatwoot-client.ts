export type ChatwootMessageClient = {
	createConversation?: (args: {
		content: string;
		contactIdentifier?: string;
		customAttributes?: Record<string, string>;
	}) => Promise<{ id: number }>;
	postPublicReply: (conversationId: number, content: string) => Promise<void>;
	postInternalNote: (conversationId: number, content: string) => Promise<void>;
	markForHuman: (conversationId: number, label?: string) => Promise<void>;
};

const HUMAN_FOLLOW_UP_LABEL = "needs-human";

async function chatwootRequest(path: string, init: RequestInit): Promise<Response | null> {
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
	if (!response.ok) throw new Error(`Chatwoot request failed: ${response.status}`);
	return response;
}

export const defaultChatwootMessageClient: ChatwootMessageClient = {
	async createConversation({ content, contactIdentifier, customAttributes }) {
		const response = await chatwootRequest("/conversations", {
			method: "POST",
			body: JSON.stringify({
				message: content,
				contact_identifier: contactIdentifier,
				custom_attributes: customAttributes,
			}),
		});
		if (!response) throw new Error("Chatwoot is not configured");
		const body = (await response.json()) as { id?: number };
		if (!body.id) throw new Error("Chatwoot conversation response has no id");
		return { id: body.id };
	},
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
