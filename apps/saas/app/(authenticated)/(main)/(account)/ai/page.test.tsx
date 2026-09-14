import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@ai/components/AiChat", () => ({
	AiChat: () => <div data-testid="ai-chat">AI Chat</div>,
}));

vi.mock("@shared/components/PageHeader", () => ({
	PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
		<header>
			<h1>{title}</h1>
			{subtitle ? <p>{subtitle}</p> : null}
		</header>
	),
}));

import AiChatPage from "./page";

describe("/ai page", () => {
	it("renders the AiChat component", () => {
		const html = renderToStaticMarkup(<AiChatPage />);

		expect(html).toContain("data-testid=\"ai-chat\"");
		expect(html).toContain("AI Chat");
		expect(html).toContain("AI 助手");
	});
});
