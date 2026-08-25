import { createCipheriv, createHash, randomBytes } from "node:crypto";

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
