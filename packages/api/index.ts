import { auth } from "@startkiter/auth";
import { logger } from "@startkiter/logs";
import { webhookHandler as paymentsWebhookHandler } from "@startkiter/payments";
import { getBaseUrl } from "@startkiter/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";

import { openApiHandler, rpcHandler } from "./orpc/handler";

export { router } from "./orpc/router";

export const app = new Hono()
	.basePath("/api")
	// Logger middleware
	.use(honoLogger((message, ...rest) => logger.log(message, ...rest)))
	// Cors middleware
	.use(
		cors({
			origin: getBaseUrl(process.env.NEXT_PUBLIC_SAAS_URL, 3000),
			allowHeaders: [
				"Content-Type",
				"Authorization",
				"X-Chatwoot-Signature",
				"X-Chatwoot-Timestamp",
				"X-Line-Signature",
				"X-Telegram-Bot-Api-Secret-Token",
			],
			allowMethods: ["POST", "GET", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	// Auth handler
	.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw))
	// Payments webhook handler
	.post("/webhooks/payments", (c) => paymentsWebhookHandler(c.req.raw))
	// Health check
	.get("/health", (c) => c.text("OK"))
	// oRPC handlers (for RPC and OpenAPI)
	.use("*", async (c, next) => {
		const isSupportWebhook =
			c.req.method === "POST" && c.req.path.includes("/support/webhook");
		const rawBody = isSupportWebhook ? await c.req.raw.clone().text() : undefined;
		const context = {
			headers: c.req.raw.headers,
			rawBody,
			url: c.req.raw.url,
		};

		const isRpc = c.req.path.includes("/rpc/");

		const handler = isRpc ? rpcHandler : openApiHandler;

		const prefix = isRpc ? "/api/rpc" : "/api";

		const { matched, response } = await handler.handle(c.req.raw, {
			prefix,
			context,
		});

		if (matched) {
			return c.newResponse(response.body, response);
		}

		await next();
	});
