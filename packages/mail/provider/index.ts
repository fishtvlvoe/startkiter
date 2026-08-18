import { send as consoleSend } from "./console";
import { send as resendSend } from "./resend";
import type { SendEmailHandler } from "../types";

/**
 * Local builds and development servers can render email flows without a
 * provider key. Production still fails at send time instead of silently
 * discarding email when RESEND_API_KEY is missing.
 */
export const send: SendEmailHandler = async (params) => {
	if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
		return consoleSend(params);
	}

	return resendSend(params);
};
