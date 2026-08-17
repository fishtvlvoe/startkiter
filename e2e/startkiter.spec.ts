import { expect, test, type Page } from "@playwright/test";

const testIds = {
	localeZhTw: "locale-toggle-zh-tw",
	localeZhCn: "locale-toggle-zh-cn",
	localeEn: "locale-toggle-en",
	colorModeToggle: "color-mode-toggle",
	colorModeLight: "color-mode-toggle-item-light",
	colorModeDark: "color-mode-toggle-item-dark",
	sidebarCollapseToggle: "sidebar-collapse-toggle",
} as const;

function getTestId(page: Page, testId: string) {
	return page.getByTestId(testId);
}

async function rootAppearance(page: Page) {
	return page.locator("html").evaluate((element) => ({
		className: element.className,
		dataTheme: element.getAttribute("data-theme"),
	}));
}

async function localeCookieValue(page: Page) {
	return (await page.context().cookies()).find((cookie) => cookie.name === "NEXT_LOCALE")?.value ?? null;
}

test("11.1 首頁 → 登入頁 → 後台首頁 → 課程頁導覽流程", async ({ page }) => {
	test.skip(
		!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
		"需要 E2E_TEST_EMAIL 與 E2E_TEST_PASSWORD 才能完成登入後流程",
	);

	await page.goto("/");
	await expect(page.locator("main.home-main")).toBeVisible();
	await page.getByRole("link", { name: /登入|log in/i }).first().click();

	await expect(page).toHaveURL(/\/login(?:\?|$)/);
	await page.locator('input[name="email"]').fill(process.env.E2E_TEST_EMAIL!);
	await page.locator('input[name="password"]').fill(process.env.E2E_TEST_PASSWORD!);
	await page.locator('button[type="submit"]').click();

	await expect(page).toHaveURL(/\/app(?:\?|$)/);
	await expect(page.locator("main.app-main-root")).toBeVisible();
	await page.getByRole("link", { name: /課程|course/i }).click();

	await expect(page).toHaveURL(/\/course(?:\?|$)/);
	await expect(page.locator("main.app-main-root h1")).toHaveText("觀看開站包");
	await expect(page.locator('main.app-main-root [data-slot="player"]')).toBeVisible();
});

test("11.2 首頁可切換 zh-TW、zh-CN、en 並顯示對應 hero 文字", async ({ page }) => {
	await page.goto("/");

	for (const locale of [
		{ id: testIds.localeZhTw, value: "zh-tw", title: "一次買斷，帶走課與終身代碼包" },
		{ id: testIds.localeZhCn, value: "zh-cn", title: "一次买断，带走课程与终身代码包" },
		{ id: testIds.localeEn, value: "en", title: "Buy once. Take the course and lifetime code package with you." },
	]) {
		await getTestId(page, locale.id).click();
		await expect.poll(() => localeCookieValue(page)).toBe(locale.value);
		await expect(page.locator("main.home-main h1")).toHaveText(locale.title);
	}
});

test("11.3 深色與淺色模式切換會更新根節點狀態", async ({ page }) => {
	await page.goto("/");

	await expect(getTestId(page, testIds.colorModeToggle)).toBeVisible();
	await getTestId(page, testIds.colorModeDark).click();
	await expect
		.poll(async () => {
			const appearance = await rootAppearance(page);
			return `${appearance.className} ${appearance.dataTheme ?? ""}`;
		})
		.toContain("dark");

	await getTestId(page, testIds.colorModeLight).click();
	await expect
		.poll(async () => {
			const appearance = await rootAppearance(page);
			return `${appearance.className} ${appearance.dataTheme ?? ""}`;
		})
		.toContain("light");
});

test("11.4 後台側邊欄可收合與展開", async ({ page }) => {
	test.skip(
		!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
		"需要 E2E_TEST_EMAIL 與 E2E_TEST_PASSWORD 才能驗證登入後側欄",
	);

	await page.goto("/app");

	const sidebar = page.locator("#app-sidebar");
	const toggle = getTestId(page, testIds.sidebarCollapseToggle);
	await expect(sidebar).toBeVisible();
	await expect(sidebar).toHaveAttribute("data-collapsed", "false");

	await toggle.click();
	await expect(sidebar).toHaveAttribute("data-collapsed", "true");

	await toggle.click();
	await expect(sidebar).toHaveAttribute("data-collapsed", "false");
});
