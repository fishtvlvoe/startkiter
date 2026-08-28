import { expect, test } from "@playwright/test";

test.describe("blog list", () => {
	test("filters posts by the tag query param", async ({ page }) => {
		await page.goto("/zh-tw/blog");

		const coursePost = page.locator("article").filter({ hasText: "From idea to your own site" });
		const launchPost = page
			.locator("article")
			.filter({ hasText: "A package you can explain clearly" });

		await expect(coursePost).toBeVisible();
		await expect(launchPost).toBeVisible();

		await page
			.locator('[data-test="blog-tag-filter"]')
			.getByRole("link", { name: "launch" })
			.click();

		await expect(page).toHaveURL(/[?&]tag=launch(?:&|$)/);
		await expect(launchPost).toBeVisible();
		await expect(coursePost).toHaveCount(0);

		await page.locator('[data-test="blog-tag-all"]').click();

		await expect(page).toHaveURL(/\/zh-tw\/blog\/?$/);
		await expect(coursePost).toBeVisible();
	});

	test("shows an empty state for an unknown tag", async ({ page }) => {
		await page.goto("/zh-tw/blog?tag=not-a-real-tag");

		await expect(page.locator('[data-test="blog-empty-filter"]')).toBeVisible();
		await expect(
			page.locator("article").filter({ hasText: "From idea to your own site" }),
		).toHaveCount(0);
	});
});
