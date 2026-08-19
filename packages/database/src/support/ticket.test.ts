import { randomUUID } from "node:crypto";

import { afterAll, afterEach, describe, expect, it } from "vitest";

import { db } from "../../prisma/client";
import type { SupportTicketChannel, SupportTicketStatus } from "../../prisma/generated/client";

type SupportTicketDelegate = {
	deleteMany(args: { where: { userId: string } }): Promise<unknown>;
};

const supportTicketDelegate = (db as unknown as { supportTicket?: SupportTicketDelegate }).supportTicket;
const createdUserIds: string[] = [];
let nextConversationId = 1_000_000;

async function createTestUser() {
	const user = await db.user.create({
		data: {
			name: "Support ticket test buyer",
			email: `support-ticket-${randomUUID()}@example.com`,
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});

	createdUserIds.push(user.id);
	return user;
}

function nextChatwootConversationId() {
	nextConversationId += 1;
	return nextConversationId;
}

describe.sequential("SupportTicket database constraints", () => {
	afterEach(async () => {
		const userId = createdUserIds.pop();
		if (!userId) return;

		if (supportTicketDelegate) {
			try {
				await supportTicketDelegate.deleteMany({ where: { userId } });
			} catch (error) {
				if ((error as { code?: string }).code !== "P2021") throw error;
			}
		}
		await db.user.delete({ where: { id: userId } });
	});

	afterAll(async () => {
		await db.$disconnect();
	});

	it("accepts a ticket without a buyer deployment", async () => {
		const user = await createTestUser();

		const ticket = await db.supportTicket.create({
			data: {
				userId: user.id,
				buyerDeploymentId: null,
				chatwootConversationId: nextChatwootConversationId(),
				channel: "WEB_WIDGET" as SupportTicketChannel,
			},
		});

		expect(ticket.buyerDeploymentId).toBeNull();
		expect(ticket.status).toBe("OPEN" satisfies SupportTicketStatus);
	});

	it("rejects a ticket with an unknown buyer deployment", async () => {
		const user = await createTestUser();

		await expect(
			db.supportTicket.create({
				data: {
					userId: user.id,
					buyerDeploymentId: `missing-deployment-${randomUUID()}`,
					chatwootConversationId: nextChatwootConversationId(),
					channel: "WEB_WIDGET" as SupportTicketChannel,
				},
			}),
		).rejects.toMatchObject({ code: "P2003" });
	});

	it("rejects duplicate Chatwoot conversation ids", async () => {
		const user = await createTestUser();
		const chatwootConversationId = nextChatwootConversationId();

		await db.supportTicket.create({
			data: {
				userId: user.id,
				chatwootConversationId,
				channel: "WEB_WIDGET" as SupportTicketChannel,
			},
		});

		await expect(
			db.supportTicket.create({
				data: {
					userId: user.id,
					chatwootConversationId,
					channel: "LINE" as SupportTicketChannel,
				},
			}),
		).rejects.toMatchObject({ code: "P2002" });
	});
});
