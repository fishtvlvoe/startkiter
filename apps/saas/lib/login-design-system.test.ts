import { describe, expect, it } from "vitest";

const appUrl = process.env.SAAS_URL ?? "http://localhost:3001";

describe("login uses the shared design system", () => {
	it("GET /login renders email, password, and submit with data-slot markers", async () => {
		const response = await fetch(`${appUrl}/login`);
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).toMatch(/type="email"[\s\S]{0,200}data-slot="input"|data-slot="input"[\s\S]{0,200}type="email"/);
		expect(html).toMatch(
			/type="password"[\s\S]{0,200}data-slot="input"|data-slot="input"[\s\S]{0,200}type="password"/,
		);
		expect(html).toMatch(/type="submit"[\s\S]{0,200}data-slot="button"|data-slot="button"[\s\S]{0,200}type="submit"/);
	});
});
