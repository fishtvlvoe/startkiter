import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function keyFromSecret(secret: string): Buffer {
	return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptMissionFormValue(value: string, secret: string): string {
	if (!secret.trim()) {
		throw new Error("SETTINGS_ENCRYPTION_KEY missing");
	}

	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", keyFromSecret(secret), iv);
	const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptMissionFormValue(payload: string, secret: string): string | null {
	if (!secret.trim() || !payload.startsWith("v1:")) {
		return null;
	}

	const parts = payload.split(":");
	if (parts.length !== 4) {
		return null;
	}

	try {
		const iv = Buffer.from(parts[1] ?? "", "base64");
		const tag = Buffer.from(parts[2] ?? "", "base64");
		const data = Buffer.from(parts[3] ?? "", "base64");
		const decipher = createDecipheriv("aes-256-gcm", keyFromSecret(secret), iv);
		decipher.setAuthTag(tag);
		return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
	} catch {
		return null;
	}
}
