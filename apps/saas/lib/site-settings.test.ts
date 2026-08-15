import { afterEach, describe, expect, it } from "vitest";

import { writePayuniSettings } from "./site-settings";

const PREV_KEY = process.env.SETTINGS_ENCRYPTION_KEY;

afterEach(() => {
	if (PREV_KEY === undefined) {
		delete process.env.SETTINGS_ENCRYPTION_KEY;
	} else {
		process.env.SETTINGS_ENCRYPTION_KEY = PREV_KEY;
	}
});

describe("writePayuniSettings", () => {
	it("returns 503 and does not write plaintext when SETTINGS_ENCRYPTION_KEY is missing", async () => {
		delete process.env.SETTINGS_ENCRYPTION_KEY;

		const result = await writePayuniSettings({
			patch: {
				merchantId: "M1",
				hashKey: "12345678901234567890123456789012",
				hashIV: "1234567890123456",
			},
			actorUserId: "user_1",
		});

		expect(result).toEqual({
			ok: false,
			error: "encryption_key_required",
			httpStatus: 503,
		});
	});

	it("returns 400 for the wrong hashKey length before touching the database", async () => {
		process.env.SETTINGS_ENCRYPTION_KEY = "test-settings-encryption-key-32ch";

		const result = await writePayuniSettings({
			patch: {
				merchantId: "M1",
				hashKey: "short",
				hashIV: "1234567890123456",
			},
			actorUserId: "user_1",
		});

		expect(result).toEqual({
			ok: false,
			error: "invalid_hash_key",
			httpStatus: 400,
		});
	});
});
