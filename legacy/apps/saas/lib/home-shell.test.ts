import { describe, expect, it } from "vitest";

const appUrl = process.env.SAAS_URL ?? "http://localhost:3001";

describe("shell pages use the shared design system", () => {
	it("GET / does not rely on homemade .hero or .button classes as its only styling", async () => {
		const response = await fetch(`${appUrl}/`);
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).not.toMatch(/class="hero"/);
		expect(html).not.toMatch(/class="button"/);
		expect(html).toContain('data-slot="button"');
		expect(html).toContain('data-slot="badge"');
		expect(html).toContain('data-slot="card"');
	});
});
