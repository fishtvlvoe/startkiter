import { expect, test } from "@playwright/test";

test("renders the current StartKiter changelog entry", async ({ page }) => {
	await page.goto("/zh-tw/changelog");

	await expect(page.getByRole("heading", { name: "StartKiter 開站包推出" })).toBeVisible();
	await expect(page.locator("body")).not.toContainText("undefined");
});
