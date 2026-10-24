// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/admin/course" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

import { SupportWidget } from "./components/SupportWidget";

const positionKey = "startkiter.support-widget.position";
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
	vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "");
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	// 測試環境未提供 Storage；只模擬本機儲存，不模擬客服或 AI 回覆。
	const entries = new Map<string, string>();
	vi.stubGlobal("localStorage", {
		getItem: (key: string) => entries.get(key) ?? null,
		setItem: (key: string, value: string) => entries.set(key, value),
		removeItem: (key: string) => entries.delete(key),
	});
	window.localStorage.removeItem(positionKey);
	window.localStorage.removeItem("startkiter.support-widget.collapsed");
	window.localStorage.setItem("other-agent", "保留");
	route.pathname = "/admin/course";
	Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
	Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
		x: 0, y: 0, left: 0, top: 0, right: 208, bottom: 80, width: 208, height: 80,
		toJSON: () => ({}),
	});
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	document.body.replaceChildren();
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

async function mount(deployments: Parameters<typeof SupportWidget>[0]["deployments"] = []) {
	await act(async () => root.render(<SupportWidget deployments={deployments} />));
}

function button(label: string) {
	const found = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
	expect(found, label).not.toBeNull();
	return found!;
}

async function click(label: string) {
	await act(async () => button(label).click());
}

function widget() {
	const found = container.querySelector<HTMLElement>('[aria-label="客服浮動控制"]');
	expect(found).not.toBeNull();
	return found!;
}

async function pointer(target: HTMLElement, type: string, x: number, y: number) {
	const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
	Object.defineProperty(event, "pointerId", { value: 1 });
	await act(async () => target.dispatchEvent(event));
}

describe("M2 task 4.3 客服互動", () => {
	it.each(['/admin/course','/course/lesson-1','/settings/general','/support'])('新殼 %s 不出現浮動客服，保留原偏好',async(path)=>{
		vi.stubEnv('NEXT_PUBLIC_CREATOR_SHELL','1');
		route.pathname=path;
		window.localStorage.setItem(positionKey,JSON.stringify({x:20,y:30}));
		await mount();
		expect(container.querySelector('[aria-label="客服浮動控制"]')).toBeNull();
		expect(window.localStorage.getItem(positionKey)).toBe(JSON.stringify({x:20,y:30}));
	});
	it('個人頁隱藏時resize，回到課堂仍重新限制位置',async()=>{
		window.localStorage.setItem(positionKey,JSON.stringify({x:9999,y:9999}));
		route.pathname='/settings/security';await mount();
		Object.defineProperty(window,'innerWidth',{configurable:true,value:320});
		window.dispatchEvent(new Event('resize'));
		route.pathname='/course/lesson-1';await mount();
		expect(Number.parseFloat(widget().style.left)+208).toBeLessThanOrEqual(320);
		expect(window.localStorage.getItem('other-agent')).toBe('保留');
	});
	it.each(['/settings/general','/settings/security','/settings/billing','/settings/notifications'])('%s 不掛浮動客服遮住設定控制',async(path)=>{
		route.pathname=path;
		await mount();
		expect(container.querySelector('[aria-label="客服浮動控制"]')).toBeNull();
		expect(window.localStorage.getItem('other-agent')).toBe('保留');
	});
	it("手機課堂客服保留助教底部輸入區", async () => {
		route.pathname='/course/lesson-1';
		await mount();
		expect(Number.parseFloat(widget().style.top)+80).toBeLessThanOrEqual(844-132);
	});
	it("客服未設定時顯示真實 Dialog 與客服入口", async () => {
		await mount();
		await click("開啟線上客服");
		const dialog = document.querySelector('[role="dialog"]');
		expect(dialog?.textContent).toContain("客服尚未設定");
		expect(dialog?.querySelector('a[href="/support"]')).not.toBeNull();
		expect(dialog?.textContent).toContain("AI 助教");
	});

	it("390px 課堂預設左下，客服與 AI 助教有不同標示", async () => {
		route.pathname = "/course/lesson-1";
		await mount();
		expect(Number.parseFloat(widget().style.left)).toBe(16);
		expect(Number.parseFloat(widget().style.top)).toBeGreaterThan(500);
		expect(widget().textContent).toContain("客服");
	});

	it("左右停靠是可用鍵盤操作的 button，儲存專用位置、不清其他 storage", async () => {
		await mount();
		await click("客服停靠左側");
		expect(widget().style.left).toBe("16px");
		await click("客服停靠右側");
		expect(Number.parseFloat(widget().style.left)).toBe(166);
		expect(button("客服停靠左側").type).toBe("button");
		expect(JSON.parse(window.localStorage.getItem(positionKey)!)).toMatchObject({ x: 166 });
		expect(window.localStorage.getItem("other-agent")).toBe("保留");
	});

	it("獨立 handle 拖移 clamp，不開客服；原客服 click 不被攔截", async () => {
		await mount();
		const handle = button("拖移客服位置");
		await pointer(handle, "pointerdown", 180, 690);
		await pointer(handle, "pointermove", -999, -999);
		await pointer(handle, "pointerup", -999, -999);
		expect(widget().style.left).toBe("16px");
		expect(widget().style.top).toBe("16px");
		expect(document.querySelector('[role="dialog"]')).toBeNull();
		await click("開啟線上客服");
		expect(document.querySelector('[role="dialog"]')?.textContent).toContain("客服尚未設定");
	});

	it("向右下拖出邊界與 resize 仍在 viewport 內", async () => {
		await mount();
		const handle = button("拖移客服位置");
		await pointer(handle, "pointerdown", 180, 690);
		await pointer(handle, "pointermove", 9999, 9999);
		await pointer(handle, "pointerup", 9999, 9999);
		expect(Number.parseFloat(widget().style.left) + 208).toBeLessThanOrEqual(390);
		expect(Number.parseFloat(widget().style.top) + 80).toBeLessThanOrEqual(844);
		Object.defineProperty(window, "innerWidth", { value: 320 });
		Object.defineProperty(window, "innerHeight", { value: 480 });
		await act(async () => window.dispatchEvent(new Event("resize")));
		expect(Number.parseFloat(widget().style.left) + 208).toBeLessThanOrEqual(320);
		expect(Number.parseFloat(widget().style.top) + 80).toBeLessThanOrEqual(480);
	});

	it("還原既有位置並 clamp；收合、展開可用且保留其他 storage", async () => {
		window.localStorage.setItem(positionKey, JSON.stringify({ x: 9999, y: 9999 }));
		await mount();
		expect(Number.parseFloat(widget().style.left) + 208).toBeLessThanOrEqual(390);
		await click("收合客服按鈕");
		expect(window.localStorage.getItem("startkiter.support-widget.collapsed")).toBe("true");
		await click("展開客服按鈕");
		expect(button("開啟線上客服")).not.toBeNull();
		expect(window.localStorage.getItem("other-agent")).toBe("保留");
	});

	it("損壞 storage 不會讓客服消失", async () => {
		window.localStorage.setItem(positionKey, '{"x":"錯誤","y":null}');
		await mount();
		expect(Number.isFinite(Number.parseFloat(widget().style.left))).toBe(true);
		await click("開啟線上客服");
		expect(document.querySelector('[role="dialog"]')?.textContent).toContain("客服尚未設定");
	});

	it("多部署確認後若客服未設定，關閉選擇 Dialog 再顯示提示", async () => {
		await mount([{ id: "dep_1", name: "網站一" }, { id: "dep_2", name: "網站二" }]);
		await click("開啟線上客服");
		expect(document.querySelector('[role="dialog"]')?.textContent).toContain("選擇要回報問題的網站部署");
		const select = [...document.querySelectorAll("button")].find((item) => item.textContent === "網站二");
		expect(select).toBeDefined();
		await act(async () => select!.click());
		const confirm = [...document.querySelectorAll("button")].find((item) => item.textContent === "確認並開啟客服");
		await act(async () => confirm!.click());
		expect(document.querySelector('[role="dialog"]')?.textContent).toContain("客服尚未設定");
	});

	it("位置在重新掛載後保留，課堂預設不覆蓋使用者停靠偏好", async () => {
		await mount();
		await click("客服停靠右側");
		await act(async () => root.unmount());
		root = createRoot(container);
		route.pathname = "/course/lesson-1";
		await mount();
		expect(widget().style.left).toBe("166px");
	});

	it("storage 停用時拖移與客服仍可用", async () => {
		vi.spyOn(window.localStorage, "getItem").mockImplementation(() => { throw new Error("停用儲存"); });
		vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("停用儲存"); });
		await mount();
		await click("客服停靠左側");
		expect(widget().style.left).toBe("16px");
		await click("開啟線上客服");
		expect(document.querySelector('[role="dialog"]')?.textContent).toContain("客服尚未設定");
	});

	it("取消拖移後滑動不再移動客服", async () => {
		await mount();
		const handle = button("拖移客服位置");
		await pointer(handle, "pointerdown", 180, 690);
		await pointer(handle, "pointercancel", 180, 690);
		const before = widget().style.cssText;
		await pointer(handle, "pointermove", 10, 10);
		expect(widget().style.cssText).toBe(before);
	});
});
