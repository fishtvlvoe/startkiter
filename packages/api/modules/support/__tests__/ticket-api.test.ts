import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	 auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@startkiter/database", () => ({
	db: {
		buyerDeployment: { findFirst: vi.fn(), findMany: vi.fn() },
		supportTicket: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
	},
}));

vi.mock("../lib/chatwoot-client", () => ({
	defaultChatwootClient: { createConversation: vi.fn() },
	defaultChatwootMessageClient: { createConversation: vi.fn(), postPublicReply: vi.fn(), postInternalNote: vi.fn(), markForHuman: vi.fn() },
}));

import { db } from "@startkiter/database";
import { auth } from "@startkiter/auth";
import { createSupportTicket } from "../procedures/create-ticket";
import { confirmResolved } from "../procedures/confirm-resolved";
import { processTimedOutSupportTickets } from "../procedures/resolve-timeouts";

const user = { id: "user-1" };
const ticket = {
	id: "ticket-1",
	userId: user.id,
	buyerDeploymentId: "deployment-1",
	chatwootConversationId: 100,
	channel: "WEB_WIDGET" as const,
	status: "AI_SUGGESTED_RESOLVED" as const,
	aiSuggestedResolvedAt: new Date("2026-08-17T00:00:00.000Z"),
};

const context = { headers: new Headers(), user };

describe("support ticket API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue({ user, session: { userId: user.id } } as never);
	});

	it("rejects a blank message without creating a ticket or Chatwoot conversation", async () => {
		await expect(
			call(createSupportTicket, { message: "   " }, { context }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		expect(db.supportTicket.create).not.toHaveBeenCalled();
	});

	it("rejects a buyerDeploymentId owned by another user", async () => {
		vi.mocked(db.buyerDeployment.findFirst).mockResolvedValue(null);

		await expect(
			call(createSupportTicket, { message: "網站打不開", buyerDeploymentId: "other-deployment" }, { context }),
		).rejects.toMatchObject({ code: "FORBIDDEN" });

		expect(db.supportTicket.create).not.toHaveBeenCalled();
	});

	it("creates an OPEN ticket after Chatwoot creates the conversation", async () => {
		const { defaultChatwootMessageClient } = await import("../lib/chatwoot-client");
		vi.mocked(defaultChatwootMessageClient.createConversation!).mockResolvedValue({ id: 101 });
		vi.mocked(db.buyerDeployment.findFirst).mockResolvedValue({ id: "deployment-1" } as never);
		vi.mocked(db.supportTicket.create).mockResolvedValue({ ...ticket, id: "ticket-new", chatwootConversationId: 101, status: "OPEN" } as never);

		await expect(call(createSupportTicket, { message: "網站打不開", buyerDeploymentId: "deployment-1" }, { context })).resolves.toEqual({
			id: "ticket-new", chatwootConversationId: 101, status: "OPEN",
		});
	});

	it.each(["OPEN", "RESOLVED", "ESCALATED"] as const)(
		"rejects confirm-resolved when the ticket is %s",
		async (status) => {
			vi.mocked(db.supportTicket.findFirst).mockResolvedValue({ ...ticket, status } as never);

			await expect(
				call(confirmResolved, { id: ticket.id }, { context }),
			).rejects.toMatchObject({ code: "CONFLICT" });

			expect(db.supportTicket.update).not.toHaveBeenCalled();
		},
	);

	it("moves a pending ticket back to OPEN when the buyer replies during the waiting window", async () => {
		const { processChatwootWebhook } = await import("../procedures/chatwoot-webhook");
		const pending = { ...ticket, status: "AI_SUGGESTED_RESOLVED" as const };
		vi.mocked(db.supportTicket.findUnique).mockResolvedValue(pending as never);
		vi.mocked(db.supportTicket.update).mockResolvedValue({ ...pending, status: "OPEN", aiSuggestedResolvedAt: null } as never);
		vi.mocked(db.buyerDeployment.findMany).mockResolvedValue([] as never);
		vi.mocked(db.buyerDeployment.findFirst).mockResolvedValue(null);

		const payload = {
			event: "message_created",
			content: "還是無法使用",
			message_type: 0,
			conversation: { id: ticket.chatwootConversationId },
		};
		const rawBody = JSON.stringify(payload);

		await processChatwootWebhook({
			url: "https://startkiter.dev/api/support/webhook/chatwoot?token=test-secret",
			rawBody,
			payload,
			secret: "test-secret",
			deps: {
				chatwoot: { postPublicReply: vi.fn(), postInternalNote: vi.fn(), markForHuman: vi.fn() },
				generateDiagnosis: vi.fn(),
				fetchCoolifyAppStatus: vi.fn(),
				fetchCoolifyAppLogs: vi.fn(),
			},
		});

		expect(db.supportTicket.update).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: ticket.id },
			data: { status: "OPEN", aiSuggestedResolvedAt: null },
		}));
	});

	it("auto-resolves pending tickets after three days", async () => {
		vi.mocked(db.supportTicket.findMany).mockResolvedValue([ticket] as never);
		vi.mocked(db.supportTicket.update).mockResolvedValue({ ...ticket, status: "RESOLVED" } as never);
		const now = new Date("2026-08-21T00:00:00.000Z");

		await expect(processTimedOutSupportTickets(now)).resolves.toBe(1);
		expect(db.supportTicket.findMany).toHaveBeenCalledWith(expect.objectContaining({
			where: expect.objectContaining({ status: "AI_SUGGESTED_RESOLVED" }),
		}));
		expect(db.supportTicket.update).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ status: "RESOLVED", resolvedBy: "AUTO_TIMEOUT", resolvedAt: now }),
		}));
	});
});
