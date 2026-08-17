// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: ReactNode;
		[key: string]: unknown;
	}) => createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@startkiter/i18n", () => ({
	config: {
		localeCookieName: "locale",
		locales: {
			"zh-tw": { label: "繁中" },
			"zh-cn": { label: "简中" },
			en: { label: "English" },
		},
	},
	locales: ["zh-tw", "zh-cn", "en"],
}));

vi.mock("@startkiter/ui", () => ({
	ColorModeToggle: () => createElement("div", { "data-slot": "color-mode-toggle" }),
}));

import { AppShell } from "../app/components/app-shell";
import { MobileTabbar } from "../app/components/mobile-tabbar";

const roots: Root[] = [];

function setViewport(width: number) {
	Object.defineProperty(window, "innerWidth", {
		configurable: true,
		value: width,
	});
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: vi.fn((query: string) => ({
			matches: width < 768,
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

function renderAt(width: number, element: ReactNode) {
	setViewport(width);
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container);
	roots.push(root);

	act(() => {
		root.render(element);
	});

	return container;
}

const mobileProps = {
	current: "app" as const,
	showOperatorSettings: true,
};

describe("MobileTabbar viewport behavior", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		vi.stubGlobal("localStorage", {
			getItem: vi.fn(() => null),
			setItem: vi.fn(),
		});
	});

	afterEach(() => {
		for (const root of roots.splice(0)) {
			act(() => root.unmount());
		}
		document.body.replaceChildren();
	});

	it("renders exactly three fixed tabs plus 更多 below 768px", () => {
		const container = renderAt(375, createElement(MobileTabbar, mobileProps));

		expect(container.querySelectorAll('[data-slot="mobile-tab"]').length).toBe(4);
		expect(container.textContent).toContain("開始");
		expect(container.textContent).toContain("課程");
		expect(container.textContent).toContain("客服");
		expect(container.textContent).toContain("更多");
	});

	it("opens an overflow drawer that includes operator settings", () => {
		const container = renderAt(375, createElement(MobileTabbar, mobileProps));
		const moreButton = container.querySelector<HTMLButtonElement>('[data-test="mobile-more-toggle"]');

		expect(moreButton).not.toBeNull();
		act(() => {
			moreButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(container.querySelector('[data-slot="mobile-more-drawer"]')?.textContent).toContain("帳號設定");
	});

	it("keeps the desktop sidebar and omits the tab bar at 1280px", () => {
		const container = renderAt(
			1280,
			createElement(
				AppShell,
				{
					brand: "開站包",
					email: "operator@example.com",
					name: "Operator",
					locale: "zh-tw",
					current: "app",
					showOperatorSettings: true,
					heading: createElement("h1", null, "開始"),
					children: createElement("p", null, "內容"),
				},
			),
		);

		expect(container.querySelector('[data-slot="sidebar"]')).not.toBeNull();
		expect(container.querySelector('[data-slot="mobile-tabbar"]')).toBeNull();
	});
});
