import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeploymentStatusPanel } from "./components/DeploymentStatusPanel";
import { ReportIssueButton } from "./components/ReportIssueButton";

describe("email support", () => {
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
