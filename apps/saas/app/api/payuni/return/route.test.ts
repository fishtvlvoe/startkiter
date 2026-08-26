import { afterEach, describe, expect, it } from "vitest";

import { GET, POST } from "./route";

describe("PAYUNi browser return", () => {
	afterEach(() => {
		delete process.env.BETTER_AUTH_URL;
	});

	it.each(["GET", "POST"])("redirects %s to the existing checkout return page", async (method) => {
		process.env.BETTER_AUTH_URL = "http://localhost:3001";
		const request = new Request("http://localhost:3001/api/payuni/return", { method });
		const response = method === "GET" ? await GET(request) : await POST(request);

		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe("http://localhost:3001/checkout-return?status=returned");
	});
});
