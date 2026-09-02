import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	SupportWidget,
	openSupportChat,
	type SupportDeployment,
} from "./components/SupportWidget";

describe("SupportWidget - 前端客服入口與部署選擇邏輯 (Tasks 7.1-7.4)", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		// 本檔驗證 Chatwoot 路徑；預設模式已改為 email（support-email-fallback），需明確宣告
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_CHANNEL", "chatwoot");
		(globalThis as unknown as { window: unknown }).window = {
			$chatwoot: {
				setUser: vi.fn(),
				setCustomAttributes: vi.fn(),
				toggle: vi.fn(),
			},
			chatwootSDK: {
				run: vi.fn(),
			},
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};
	});

	describe("7.1 買家無 BuyerDeployment 時浮動客服框仍正常建單", () => {
		it("無部署記錄時，點擊客服直接開啟 widget 且不設定 buyerDeploymentId", () => {
			const deployments: SupportDeployment[] = [];

			const result = openSupportChat({
				deployments,
				onRequireSelection: vi.fn(),
			});

			expect(result.needsSelection).toBe(false);
			expect(window.$chatwoot?.setCustomAttributes).not.toHaveBeenCalled();
			expect(window.$chatwoot?.toggle).toHaveBeenCalledWith("open");
		});

		it("無部署記錄時，SupportWidget 元件不渲染強制選擇器並可直接觸發客服", () => {
			const deployments: SupportDeployment[] = [];
			const html = renderToStaticMarkup(<SupportWidget deployments={deployments} />);

			// 斷言有浮動客服按鈕，但沒有多部署選擇對話框
			expect(html).toContain("開啟線上客服");
			expect(html).not.toContain("選擇要回報問題的網站部署");
		});

		it("多個部署記錄時，SupportWidget 準備好部署選擇對話框結構", () => {
			const deployments: SupportDeployment[] = [
				{ id: "dep_1", publicUrl: "https://site-a.com" },
				{ id: "dep_2", publicUrl: "https://site-b.com" },
			];
			const html = renderToStaticMarkup(<SupportWidget deployments={deployments} />);

			expect(html).toContain("開啟線上客服");
		});
	});


	describe("7.2 買家多個 BuyerDeployment 時需要先選擇部署才能送出", () => {
		it("多個部署記錄時，未選擇部署無法直接開啟，需觸發選擇回呼", () => {
			const deployments: SupportDeployment[] = [
				{ id: "dep_1", publicUrl: "https://site-a.com", tier: "managed" },
				{ id: "dep_2", publicUrl: "https://site-b.com", tier: "self-hosted" },
			];

			const onRequireSelection = vi.fn();

			const result = openSupportChat({
				deployments,
				selectedDeploymentId: null,
				onRequireSelection,
			});

			expect(result.needsSelection).toBe(true);
			expect(onRequireSelection).toHaveBeenCalled();
			// 未選擇時不得直接開啟 widget 或設定 attributes
			expect(window.$chatwoot?.toggle).not.toHaveBeenCalled();
			expect(window.$chatwoot?.setCustomAttributes).not.toHaveBeenCalled();
		});

		it("多個部署記錄時，選定特定部署後才設定 custom_attributes 並開啟 widget", () => {
			const deployments: SupportDeployment[] = [
				{ id: "dep_1", publicUrl: "https://site-a.com", tier: "managed" },
				{ id: "dep_2", publicUrl: "https://site-b.com", tier: "self-hosted" },
			];

			const result = openSupportChat({
				deployments,
				selectedDeploymentId: "dep_2",
			});

			expect(result.needsSelection).toBe(false);
			expect(window.$chatwoot?.setCustomAttributes).toHaveBeenCalledWith({
				buyerDeploymentId: "dep_2",
			});
			expect(window.$chatwoot?.toggle).toHaveBeenCalledWith("open");
		});
	});

	describe("7.3 單一部署記錄時自動帶入", () => {
		it("剛好一個部署時，自動帶入該 buyerDeploymentId 並開啟 widget，不需手動選擇", () => {
			const deployments: SupportDeployment[] = [
				{ id: "dep_single", publicUrl: "https://single.com", tier: "managed" },
			];

			const onRequireSelection = vi.fn();
			const result = openSupportChat({
				deployments,
				onRequireSelection,
			});

			expect(result.needsSelection).toBe(false);
			expect(onRequireSelection).not.toHaveBeenCalled();
			expect(window.$chatwoot?.setCustomAttributes).toHaveBeenCalledWith({
				buyerDeploymentId: "dep_single",
			});
			expect(window.$chatwoot?.toggle).toHaveBeenCalledWith("open");
		});
	});
});
