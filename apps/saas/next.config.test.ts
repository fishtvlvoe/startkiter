import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config.ts redirects", () => {
	it("redirects /admin to /admin/dashboard with permanent: false", async () => {
		expect(nextConfig.redirects).toBeDefined();
		const redirects = await nextConfig.redirects!();
		const adminRedirect = redirects.find((r) => r.source === "/admin");

		expect(adminRedirect).toBeDefined();
		expect(adminRedirect).toEqual({
			source: "/admin",
			destination: "/admin/dashboard",
			permanent: false,
		});
	});
});
