import { describe, expect, it } from "vitest";
import { getAccountMenuEntries } from "./account-menu";
describe("ACCOUNT_MENU_ENTRIES visibility matrix", () => {
	it.each([
		[
			"app-user",
			{ scope: "app", appId: "course", role: "app-user" } as const,
			["user-settings", "help", "upgrade", "logout"],
		],
		[
			"app-admin",
			{ scope: "app", appId: "course", role: "app-admin" } as const,
			["user-settings", "app-admin-settings", "help", "upgrade", "logout"],
		],
		[
			"platform",
			{ scope: "platform" } as const,
			["user-settings", "platform-admin-settings", "help", "upgrade", "logout"],
		],
	] as const)("%s sees only entries allowed by WorkspaceContext", (_name, context, expectedIds) => {
		expect(getAccountMenuEntries(context).map((entry) => entry.id)).toEqual(expectedIds);
	});
	it("uses the current app id in the app-admin settings target", () => {
		const entries = getAccountMenuEntries({ scope: "app", appId: "course", role: "app-admin" });
		expect(entries.find((entry) => entry.id === "app-admin-settings")?.href).toBe("/admin/course/settings");
	});
});
