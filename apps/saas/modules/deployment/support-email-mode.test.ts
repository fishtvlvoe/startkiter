import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initChatwootSdk } from "../../app/(authenticated)/ChatwootScript";
import { openSupportChat } from "./components/SupportWidget";
import { openSupportMailForDeployment } from "./components/ReportIssueButton";

const ORIGINAL_ENV = { ...process.env };

type ChatwootMock = {
	setCustomAttributes: ReturnType<typeof vi.fn>;
	toggle: ReturnType<typeof vi.fn>;
};

function stubWindow(): { chatwoot: ChatwootMock; location: { href: string } } {
	const chatwoot: ChatwootMock = {
		setCustomAttributes: vi.fn(),
		toggle: vi.fn(),
	};
	const location = { href: "" };
	(globalThis as unknown as { window: unknown }).window = { $chatwoot: chatwoot, location };
	return { chatwoot, location };
}

describe("email 模式：客服入口改走 mailto，不碰 Chatwoot", () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_CHANNEL", "email");
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "fish@fishot.com");
	});

	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
	});

	it("浮動客服按鈕（無部署）開信件，不呼叫 $chatwoot", () => {
		const { chatwoot, location } = stubWindow();
		const result = openSupportChat({ deployments: [] });

		expect(chatwoot.toggle).not.toHaveBeenCalled();
		expect(location.href.startsWith("mailto:fish@fishot.com?")).toBe(true);
		expect(result).toEqual({ needsSelection: false, selectedId: null });
	});

	it("單一部署時信件內文帶入該部署 ID 與網址", () => {
		const { chatwoot, location } = stubWindow();
		const result = openSupportChat({
			deployments: [{ id: "dep_abc123", publicUrl: "https://buyer.example.com" }],
		});

		expect(chatwoot.setCustomAttributes).not.toHaveBeenCalled();
		expect(location.href).toContain(encodeURIComponent("dep_abc123"));
		expect(location.href).toContain(encodeURIComponent("https://buyer.example.com"));
		expect(result.selectedId).toBe("dep_abc123");
	});

	it("多部署未選時仍要求先選擇，不直接開信", () => {
		const { location } = stubWindow();
		const onRequireSelection = vi.fn();
		const result = openSupportChat({
			deployments: [{ id: "dep_a" }, { id: "dep_b" }],
			onRequireSelection,
		});

		expect(onRequireSelection).toHaveBeenCalledOnce();
		expect(location.href).toBe("");
		expect(result.needsSelection).toBe(true);
	});

	it("多部署已選時信件帶入被選中的那個部署", () => {
		const { location } = stubWindow();
		openSupportChat({
			deployments: [{ id: "dep_a" }, { id: "dep_b", publicUrl: "https://b.example.com" }],
			selectedDeploymentId: "dep_b",
		});

		expect(location.href).toContain(encodeURIComponent("dep_b"));
		expect(location.href).toContain(encodeURIComponent("https://b.example.com"));
	});

	it("/deployment 回報按鈕的信件內文帶入該部署 ID", () => {
		const { chatwoot, location } = stubWindow();
		const href = openSupportMailForDeployment("dep_report_9");

		expect(chatwoot.toggle).not.toHaveBeenCalled();
		expect(href).toContain(encodeURIComponent("dep_report_9"));
		expect(location.href).toBe(href);
	});

	it("不注入 Chatwoot SDK script（即使 websiteToken 有設）", () => {
		stubWindow();
		expect(initChatwootSdk({ websiteToken: "tok_present" })).toBe(false);
	});
});

describe("chatwoot 模式：行為與改動前完全一致（回歸保護）", () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_CHANNEL", "chatwoot");
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "fish@fishot.com");
	});

	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
	});

	it("浮動客服按鈕仍開 Chatwoot 對話框，不開信件", () => {
		const { chatwoot, location } = stubWindow();
		openSupportChat({ deployments: [] });

		expect(chatwoot.toggle).toHaveBeenCalledWith("open");
		expect(location.href).toBe("");
	});

	it("單一部署仍透過 setCustomAttributes 帶入 buyerDeploymentId", () => {
		const { chatwoot, location } = stubWindow();
		openSupportChat({ deployments: [{ id: "dep_abc123" }] });

		expect(chatwoot.setCustomAttributes).toHaveBeenCalledWith({ buyerDeploymentId: "dep_abc123" });
		expect(chatwoot.toggle).toHaveBeenCalledWith("open");
		expect(location.href).toBe("");
	});

	it("/deployment 回報按鈕仍走 Chatwoot", () => {
		const { chatwoot } = stubWindow();
		openSupportChat({ deployments: [{ id: "dep_x" }] });

		expect(chatwoot.toggle).toHaveBeenCalledWith("open");
	});
});
