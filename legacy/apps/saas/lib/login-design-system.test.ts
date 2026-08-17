import { describe, expect, it } from "vitest";

const appUrl = process.env.SAAS_URL ?? "http://localhost:3001";

describe("login uses the shared design system", () => {
	it("GET /login renders email, password, and submit with data-slot markers", async () => {
		const response = await fetch(`${appUrl}/login`);
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).toMatch(/<input[^>]*type="email"[^>]*data-slot="input"|<input[^>]*data-slot="input"[^>]*type="email"/);
		expect(html).toMatch(
			/<input[^>]*type="password"[^>]*data-slot="input"|<input[^>]*data-slot="input"[^>]*type="password"/,
		);
		expect(html).toMatch(/<button[^>]*data-slot="button"[^>]*type="submit"/);
	});
});
