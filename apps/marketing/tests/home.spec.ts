import { expect, test } from "@playwright/test";

const localeChecks = [
	{ locale: "zh-tw", heading: "用 StartKiter 把 AI 服務做成自己的站", productText: "課程與實作", billingText: "一次買斷" },
	{ locale: "zh-cn", heading: "用 StartKiter 把 AI 服务做成自己的站", productText: "课程与实践", billingText: "一次买断" },
	{ locale: "en", heading: "Turn your AI service into your own site with StartKiter", productText: "Course and practice", billingText: "One-time purchase" },
] as const;

test.describe("home page", () => {
	for (const { locale, heading, productText, billingText } of localeChecks) {
		test(`${locale} renders the real package offer`, async ({ page }) => {
			await page.goto(`/${locale}`);

			await expect(page.getByRole("heading", { name: heading })).toBeVisible();
			await expect(page.locator('[data-test="price-table-plan"]')).toHaveCount(1);
			await expect(page.locator('[data-test="price-table-plan-price"]')).toHaveText("NT$8,800");
			await expect(page.locator('[data-test="price-table-plan-billing"]')).toHaveText(billingText);
			await expect(page.locator("body")).toContainText(productText);
			await expect(page.locator("body")).not.toContainText("USD");
			await expect(page.locator("body")).not.toContainText("churn");
			await expect(page.locator("body")).not.toContainText("workspace");
			await expect(page.locator("body")).not.toContainText("invite");
			await expect(page.locator("body")).not.toContainText("subscription");
			await expect(page.locator("body")).not.toContainText("Ac" + "me");
			await expect(page.locator("body")).not.toContainText("Maya" + " Chen");
			await expect(page.locator("body")).not.toContainText("Jonas" + " Weber");
			await expect(page.locator("body")).not.toContainText("Amelia" + " Ortiz");

			await expect(page.locator('[data-test="navigation"]')).toBeVisible();
			await expect(page.locator('[data-test="color-mode-toggle"]')).toBeVisible();
		});
	}
});
