import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeploymentStatusPanel } from "./components/DeploymentStatusPanel";
import { openChatwootWithDeployment, ReportIssueButton } from "./components/ReportIssueButton";

describe("ReportIssueButton - Chatwoot Integration", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		// Reset window.$chatwoot mock
		(globalThis as unknown as { window: unknown }).window = {
			$chatwoot: {
				setUser: vi.fn(),
				setCustomAttributes: vi.fn(),
				toggle: vi.fn(),
			},
		};
	});

	it("sets buyerDeploymentId in custom_attributes and opens Chatwoot widget", () => {
		const buyerDeploymentId = "dep_test_12345";
		openChatwootWithDeployment(buyerDeploymentId);

		expect(window.$chatwoot?.setCustomAttributes).toHaveBeenCalledWith({
			buyerDeploymentId: "dep_test_12345",
		});
		expect(window.$chatwoot?.toggle).toHaveBeenCalledWith("open");
	});

	it("opens widget without setting custom_attributes when buyerDeploymentId is null or undefined", () => {
		openChatwootWithDeployment(null);

		expect(window.$chatwoot?.setCustomAttributes).not.toHaveBeenCalled();
		expect(window.$chatwoot?.toggle).toHaveBeenCalledWith("open");
	});

	it("gracefully handles missing $chatwoot instance on window without throwing", () => {
		(globalThis as unknown as { window: { $chatwoot?: unknown } }).window.$chatwoot = undefined;

		expect(() => openChatwootWithDeployment("dep_123")).not.toThrow();
	});

	it("renders ReportIssueButton with default label and icon", () => {
		const html = renderToStaticMarkup(
			<ReportIssueButton buyerDeploymentId="dep_123" />,
		);

		expect(html).toContain("回報這個部署的問題");
		expect(html).toContain("<button");
	});

	it("renders ReportIssueButton with custom children", () => {
		const html = renderToStaticMarkup(
			<ReportIssueButton buyerDeploymentId="dep_123">
				自訂回報按鈕
			</ReportIssueButton>,
		);

		expect(html).toContain("自訂回報按鈕");
	});

	it("renders ReportIssueButton within DeploymentStatusPanel", () => {
		const html = renderToStaticMarkup(
			<DeploymentStatusPanel
				view={{
					reachable: true,
					publicUrl: "https://my-store.startkiter.dev",
					deploymentId: "dep_123",
				}}
			/>,
		);

		expect(html).toContain("回報這個部署的問題");
		expect(html).toContain("需要專人協助？");
	});
});
