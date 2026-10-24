import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openSupportMailForDeployment } from "./components/ReportIssueButton";
import { openSupportChat } from "./components/SupportWidget";

const ORIGINAL_ENV = { ...process.env };

function stubWindow() {
	const location = { href: "" };
	(globalThis as unknown as { window: unknown }).window = { location };
	return location;
}

describe("email-only support entry points", () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "fish@fishot.com");
	});

	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
	});

	it("opens a prefilled mailto without a deployment", () => {
		const location = stubWindow();
		const result = openSupportChat({ deployments: [] });

		expect(location.href).toMatch(/^mailto:fish@fishot\.com\?/);
		expect(result).toEqual({ needsSelection: false, selectedId: null });
	});

	it("includes deployment details for a single deployment", () => {
		const location = stubWindow();
		const result = openSupportChat({
			deployments: [{ id: "dep_abc123", publicUrl: "https://buyer.example.com" }],
		});

		expect(location.href).toContain(encodeURIComponent("dep_abc123"));
		expect(location.href).toContain(encodeURIComponent("https://buyer.example.com"));
		expect(result.selectedId).toBe("dep_abc123");
	});

	it("requires a deployment choice when multiple deployments exist", () => {
		const location = stubWindow();
		const onRequireSelection = vi.fn();
		const result = openSupportChat({
			deployments: [{ id: "dep_a" }, { id: "dep_b" }],
			onRequireSelection,
		});

		expect(onRequireSelection).toHaveBeenCalledOnce();
		expect(location.href).toBe("");
		expect(result.needsSelection).toBe(true);
	});

	it("opens the selected deployment mailto", () => {
		const location = stubWindow();
		openSupportChat({
			deployments: [{ id: "dep_a" }, { id: "dep_b", publicUrl: "https://b.example.com" }],
			selectedDeploymentId: "dep_b",
		});

		expect(location.href).toContain(encodeURIComponent("dep_b"));
		expect(location.href).toContain(encodeURIComponent("https://b.example.com"));
	});

	it("opens the deployment report mailto", () => {
		const location = stubWindow();
		const href = openSupportMailForDeployment("dep_report_9");

		expect(href).not.toBeNull();
		expect(location.href).toBe(href);
		expect(href).toContain(encodeURIComponent("dep_report_9"));
	});
});
