import { describe, expect, it } from "vitest";

import { getSocialProviders, mapLineProfileToUser } from "./providers";

describe("social provider configuration", () => {
	it("does not enable providers without complete credentials", () => {
		expect(getSocialProviders({})).toEqual({});
		expect(
			getSocialProviders({
				GOOGLE_CLIENT_ID: "google-id",
				GOOGLE_CLIENT_SECRET: "",
				LINE_CHANNEL_ID: "line-id",
				LINE_CHANNEL_SECRET: "line-secret",
			}),
		).toHaveProperty("line");
	});

	it("maps a LINE profile without email to a stable internal identity", () => {
		expect(
			mapLineProfileToUser({
				sub: "U1234567890abcdef",
				name: "LINE 使用者",
			}),
		).toMatchObject({
			email: "line-u1234567890abcdef@accounts.startkiter.invalid",
		});
	});
});
