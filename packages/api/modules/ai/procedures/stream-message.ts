import { streamToEventIterator } from "@orpc/client";
import { eventIterator, ORPCError } from "@orpc/server";
import {
	convertToModelMessages,
	createGenerateSpreadsheetTool,
	safeValidateUIMessages,
	streamText,
	textModel,
	type UIMessageChunk,
} from "@startkiter/ai";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

function isUIMessageChunk(value: unknown): value is UIMessageChunk {
	return (
		typeof value === "object" && value !== null && "type" in value && typeof value.type === "string"
	);
}

export const streamMessage = protectedProcedure
	.route({
		method: "POST",
		path: "/ai/stream",
		tags: ["AI"],
		summary: "Stream AI response",
		description: "Stream an AI response without storing the chat",
	})
	.input(
		z.object({
			messages: z.array(z.unknown()).min(1).max(100),
		}),
	)
	.output(
		eventIterator(
			z.custom<UIMessageChunk>(isUIMessageChunk, {
				message: "Invalid UI message stream chunk",
			}),
		),
	)
	.handler(async ({ input, context }) => {
		const validatedMessages = await safeValidateUIMessages({
			messages: input.messages,
		});

		if (!validatedMessages.success) {
			throw new ORPCError("BAD_REQUEST", {
				message: "Invalid chat messages",
			});
		}

		const response = streamText({
			model: textModel,
			messages: await convertToModelMessages(validatedMessages.data),
			tools: {
				generateSpreadsheet: createGenerateSpreadsheetTool(context.user),
			},
		});

		return streamToEventIterator(response.toUIMessageStream());
	});
