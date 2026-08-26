import { createHash, createCipheriv, createDecipheriv, timingSafeEqual } from "node:crypto";

export type PayUniConfig = {
	merchantId: string;
	hashKey: string;
	hashIV: string;
	apiUrl: string;
};

export type PayUniFormData = {
	MerID: string;
	Version: string;
	EncryptInfo: string;
	HashInfo: string;
};

export type PayUniResponse = {
	Status: string;
	Message?: string;
	TradeNo?: string;
	TradeAmt?: number | string;
	MerTradeNo?: string;
	PaymentType?: string;
	[key: string]: unknown;
};

type PayUniApiEnvelope =
	| { kind: "encrypted"; encryptInfo: string; hashInfo: string }
	| { kind: "error"; status: string; message: string };

function parsePayUniApiEnvelope(text: string): PayUniApiEnvelope {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error("PAYUNi API response is not valid JSON");
	}

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("PAYUNi API response has an invalid shape");
	}

	const record = parsed as Record<string, unknown>;
	const status = typeof record.Status === "string" ? record.Status : "";
	const message = typeof record.Message === "string" ? record.Message : "";
	if (status === "ERROR" || (!record.EncryptInfo && status && status !== "SUCCESS")) {
		return { kind: "error", status: status || "ERROR", message: message || "PAYUNi rejected the request" };
	}

	if (
		typeof record.EncryptInfo !== "string" ||
		typeof record.HashInfo !== "string" ||
		!record.EncryptInfo ||
		!record.HashInfo
	) {
		throw new Error("PAYUNi API response is missing EncryptInfo or HashInfo");
	}

	return { kind: "encrypted", encryptInfo: record.EncryptInfo, hashInfo: record.HashInfo };
}

/** 改寫抽自 thetu payuni-crypto；保留 AES-256-GCM 與簽章契約。 */
export class PayUniService {
	private config: PayUniConfig;
	private readonly version = "1.0";

	constructor(config: PayUniConfig) {
		if (config.hashKey.length !== 32) {
			throw new Error(`HashKey must be exactly 32 characters, got ${config.hashKey.length}`);
		}
		if (config.hashIV.length !== 16) {
			throw new Error(`HashIV must be exactly 16 characters, got ${config.hashIV.length}`);
		}
		this.config = config;
	}

	private buildQueryString(data: Record<string, unknown>): string {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(data)) {
			if (value !== undefined && value !== null && value !== "") {
				params.append(key, String(value));
			}
		}
		return params.toString();
	}

	encrypt(data: string): { encryptInfo: string; hashInfo: string } {
		const { hashKey, hashIV } = this.config;
		const cipher = createCipheriv("aes-256-gcm", Buffer.from(hashKey, "utf8"), Buffer.from(hashIV, "utf8"));
		let encrypted = cipher.update(data, "utf8", "base64");
		encrypted += cipher.final("base64");
		const tagBase64 = cipher.getAuthTag().toString("base64");
		const encryptInfo = Buffer.from(`${encrypted}:::${tagBase64}`, "utf8").toString("hex");
		const hashInfo = createHash("sha256")
			.update(hashKey + encryptInfo + hashIV)
			.digest("hex")
			.toUpperCase();
		return { encryptInfo, hashInfo };
	}

	decrypt(encryptInfo: string): string {
		const { hashKey, hashIV } = this.config;
		const combined = Buffer.from(encryptInfo, "hex").toString("utf8");
		const [encrypted = "", tagBase64 = ""] = combined.split(":::");
		if (!encrypted || !tagBase64) {
			throw new Error("Invalid encrypted data format");
		}
		const decipher = createDecipheriv("aes-256-gcm", Buffer.from(hashKey, "utf8"), Buffer.from(hashIV, "utf8"));
		decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
		let decrypted = decipher.update(encrypted, "base64", "utf8");
		decrypted += decipher.final("utf8");
		return decrypted;
	}

	createFormData(tradeData: Record<string, unknown>): PayUniFormData {
		const fullTradeData: Record<string, unknown> = {
			MerID: this.config.merchantId,
			Timestamp: Math.floor(Date.now() / 1000),
			...tradeData,
		};
		const queryString = this.buildQueryString(fullTradeData);
		const { encryptInfo, hashInfo } = this.encrypt(queryString);
		return {
			MerID: this.config.merchantId,
			Version: this.version,
			EncryptInfo: encryptInfo,
			HashInfo: hashInfo,
		};
	}

	verifyAndDecrypt(encryptInfo: string, hashInfo: string): PayUniResponse {
		const { hashKey, hashIV } = this.config;
		const expectedHash = createHash("sha256")
			.update(hashKey + encryptInfo + hashIV)
			.digest("hex")
			.toUpperCase();
		const expectedBuf = Buffer.from(expectedHash, "utf8");
		const providedBuf = Buffer.from((hashInfo || "").toUpperCase(), "utf8");
		if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
			throw new Error("Hash verification failed");
		}
		const decrypted = this.decrypt(encryptInfo);
		const params = new URLSearchParams(decrypted);
		const result: Record<string, string> = {};
		params.forEach((value, key) => {
			result[key] = value;
		});
		return result as unknown as PayUniResponse;
	}

	getApiUrl(): string {
		return this.config.apiUrl;
	}

	isTradeSuccess(status: string): boolean {
		return status === "SUCCESS";
	}

	async requestApi(
		apiUrl: string,
		tradeData: Record<string, unknown>,
		options: { timeoutMs?: number; version?: string } = {},
	): Promise<PayUniResponse> {
		const form = this.createFormData(tradeData);
		const body = new URLSearchParams({
			MerID: form.MerID,
			Version: options.version ?? form.Version,
			EncryptInfo: form.EncryptInfo,
			HashInfo: form.HashInfo,
		}).toString();
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);

		let response: Response;
		try {
			response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
					"User-Agent": "payuni",
				},
				body,
				signal: controller.signal,
			});
			if (!response.ok) {
				throw new Error(`PAYUNi API returned HTTP ${response.status}`);
			}

			const envelope = parsePayUniApiEnvelope(await response.text());
			if (envelope.kind === "error") {
				return { Status: envelope.status, Message: envelope.message };
			}
			return this.verifyAndDecrypt(envelope.encryptInfo, envelope.hashInfo);
		} catch (error) {
			if (controller.signal.aborted) {
				throw new Error("PAYUNi API request timed out");
			}
			throw error;
		} finally {
			clearTimeout(timeout);
		}
	}
}
