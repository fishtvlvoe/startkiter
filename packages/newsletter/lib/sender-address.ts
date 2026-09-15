import { db } from "@startkiter/database";

export const NEWSLETTER_SENDER_ADDRESS_SETTING_ID = "newsletter.senderPhysicalAddress";

type SenderAddressPayload = {
	physicalAddress: string;
};

function parseAddress(ciphertext: string): string {
	const trimmed = ciphertext.trim();
	if (!trimmed) return "";
	try {
		const parsed: unknown = JSON.parse(trimmed);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			const row = parsed as Record<string, unknown>;
			return typeof row.physicalAddress === "string" ? row.physicalAddress.trim() : "";
		}
	} catch {
		return trimmed;
	}
	return "";
}

/** 讀取寄件人實體地址（促銷信 footer／啟動前 gate 用）。 */
export async function getSenderPhysicalAddress(): Promise<string> {
	const row = await db.siteSetting.findUnique({
		where: { id: NEWSLETTER_SENDER_ADDRESS_SETTING_ID },
	});
	if (!row) return "";
	return parseAddress(row.ciphertext);
}

export function assertSenderAddressConfigured(
	address: string,
): { ok: true } | { ok: false; reason: string } {
	if (!address.trim()) {
		return { ok: false, reason: "sender_physical_address_required" };
	}
	return { ok: true };
}

export async function setSenderPhysicalAddress(params: {
	physicalAddress: string;
	updatedBy?: string | null;
}): Promise<void> {
	const payload: SenderAddressPayload = {
		physicalAddress: params.physicalAddress.trim(),
	};
	await db.siteSetting.upsert({
		where: { id: NEWSLETTER_SENDER_ADDRESS_SETTING_ID },
		create: {
			id: NEWSLETTER_SENDER_ADDRESS_SETTING_ID,
			ciphertext: JSON.stringify(payload),
			updatedBy: params.updatedBy ?? null,
		},
		update: {
			ciphertext: JSON.stringify(payload),
			updatedBy: params.updatedBy ?? null,
		},
	});
}
