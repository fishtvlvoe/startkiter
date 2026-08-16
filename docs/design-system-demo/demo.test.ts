import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const demoDir = dirname(fileURLToPath(import.meta.url));

const sourceThemePath =
	"/Users/fishtv/Development/products/startkiter/code/supastarter-nextjs-main/tooling/tailwind/theme.css";

function readDemo(name: string) {
	return readFileSync(resolve(demoDir, name), "utf8");
}

function extractCustomProperty(css: string, name: string) {
	const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
	return match?.[1].trim();
}

function countAttr(html: string, selectorAttr: string, value: string) {
	const pattern = new RegExp(`${selectorAttr}="${value}"`, "g");
	return html.match(pattern)?.length ?? 0;
}

describe("design-system HTML demos", () => {
	it("ports --radius from the supastarter theme instead of approximating it", () => {
		const sourceTheme = readFileSync(sourceThemePath, "utf8");
		const tokens = readDemo("tokens.css");

		expect(extractCustomProperty(tokens, "--radius")).toBe(
			extractCustomProperty(sourceTheme, "--radius"),
		);
		expect(extractCustomProperty(tokens, "--radius")).toBe("0.75rem");
	});

	it("declares light tokens on :root and dark tokens on .dark", () => {
		const tokens = readDemo("tokens.css");

		expect(tokens).toMatch(/:root\s*\{[\s\S]*--background:/);
		expect(tokens).toMatch(/\.dark\s*\{[\s\S]*--background:/);
		expect(extractCustomProperty(tokens, "--accent")).toBe("var(--color-zinc-100)");
	});

	it("uses DM Sans with Noto Sans TC as the immediate CJK fallback", () => {
		const tokens = readDemo("tokens.css");

		expect(tokens).toMatch(/font-family:\s*"DM Sans",\s*"Noto Sans TC",\s*sans-serif;/);
	});

	it("home demo has dual color modes, design-system buttons, and spec CTA copy", () => {
		const html = readDemo("home.html");

		expect(html).toContain('data-test="color-mode-toggle"');
		expect(html).toContain("classList");
		expect(html).toContain("dark");
		expect(html).toContain("取得開站包");
		expect(html).toContain("看示範");
		expect(html).toContain("NT$8,800");
		expect(countAttr(html, "data-slot", "button")).toBeGreaterThanOrEqual(2);
		expect(html).not.toMatch(/class="hero"/);
		expect(html).not.toMatch(/class="button"/);
	});

	it("login demo exposes email and password inputs plus a submit button with data-slot", () => {
		const html = readDemo("login.html");

		expect(html).toContain('data-test="color-mode-toggle"');
		expect(countAttr(html, "data-slot", "input")).toBeGreaterThanOrEqual(2);
		expect(html).toMatch(/type="email"[\s\S]*data-slot="input"|data-slot="input"[\s\S]*type="email"/);
		expect(html).toMatch(
			/type="password"[\s\S]*data-slot="input"|data-slot="input"[\s\S]*type="password"/,
		);
		expect(countAttr(html, "data-slot", "button")).toBeGreaterThanOrEqual(1);
		expect(html).toContain("使用 Google 登入");
		expect(html).toContain("使用 LINE 登入");
		expect(html).toContain("建立帳號");
	});

	it("app demo uses a sidebar-plus-content layout with the same shared tokens", () => {
		const html = readDemo("app.html");

		expect(html).toContain('data-test="color-mode-toggle"');
		expect(html).toContain('data-slot="sidebar"');
		expect(html).toContain("進入課程");
		expect(html).toContain('href="tokens.css"');
		expect(html).not.toMatch(/class="hero"/);
		expect(html).not.toMatch(/class="button"/);
	});

	it("shared demo script collapses the app sidebar from one toggle", () => {
		const script = readDemo("demo.js");

		expect(script).toContain("setDemoSidebarCollapsed");
		expect(script).toContain("is-sidebar-collapsed");
		expect(readDemo("app.html")).toContain('data-test="sidebar-collapse-toggle"');
		expect(readDemo("course.html")).toContain('data-test="sidebar-collapse-toggle"');
	});

	it("course demo has a lesson rail, player placeholder, progress, and catalog titles", () => {
		const html = readDemo("course.html");

		expect(html).toContain('data-test="color-mode-toggle"');
		expect(html).toContain('href="tokens.css"');
		expect(html).toContain('data-slot="sidebar"');
		expect(html).toContain('data-slot="lesson-list"');
		expect(html).toContain('data-slot="player"');
		expect(html).toContain("開站包是什麼、為什麼要買斷");
		expect(html).toContain("站殼、登入與結帳路徑");
		expect(html).toContain("課程模組與權限閘門");
		expect(html).toMatch(/1\s*\/\s*3/);
		expect(html).not.toMatch(/class="hero"/);
		expect(html).not.toMatch(/class="button"/);
		expect(html).not.toMatch(/class="lesson-list"/);
	});

	it("course demo shows an honest comments placeholder without fake discussion UI", () => {
		const html = readDemo("course.html");

		expect(html).toContain('data-slot="comments"');
		expect(html).toContain("留言區佔位");
		expect(html).toContain("下一輪 change 接上真實討論功能");
		expect(html).not.toMatch(/<textarea\b/i);
		expect(html).not.toMatch(/假留言|匿名學員|讚$|回覆這則/);
	});

	it("course demo marks a course-admin entry without shipping an editor", () => {
		const html = readDemo("course.html");

		expect(html).toContain('data-slot="course-admin"');
		expect(html).toContain("課程內容管理");
		expect(html).toContain("下一輪 change 接上");
		expect(html).not.toMatch(/單元標題|儲存課程|新增單元/);
		expect(html).not.toMatch(/<form\b[^>]*(course|lesson|admin)/i);
	});
});

