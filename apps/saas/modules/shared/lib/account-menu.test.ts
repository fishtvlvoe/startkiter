import { describe, expect, it } from "vitest";
import { getAccountMenuEntries } from "./account-menu";
describe("ACCOUNT_MENU_ENTRIES visibility matrix", () => {
	it.each([
		[
			"app, app-user (platformAdmin: false)",
			{ scope: "app", appId: "course", role: "app-user" } as const,
			false,
			["upgrade", "logout"],
		],
		[
			"app, app-admin (platformAdmin: false)",
			{ scope: "app", appId: "course", role: "app-admin" } as const,
			false,
			["app-admin-settings", "upgrade", "logout"],
		],
		[
			"app, app-admin (platformAdmin: true)",
			{ scope: "app", appId: "course", role: "app-admin" } as const,
			true,
			["app-admin-settings", "platform-admin-settings", "upgrade", "logout"],
		],
		[
			"platform (platformAdmin: true)",
			{ scope: "platform" } as const,
			true,
			["upgrade", "logout"],
		],
	] as const)(
		"%s sees only entries allowed by WorkspaceContext and platformAdmin",
		(_name, context, platformAdmin, expectedIds) => {
			expect(
				getAccountMenuEntries(context, { platformAdmin }).map((entry) => entry.id),
			).toEqual(expectedIds);
		},
	);

	it("uses the current app id in the app-admin settings target", () => {
		const entries = getAccountMenuEntries(
			{ scope: "app", appId: "course", role: "app-admin" },
			{ platformAdmin: false },
		);
		expect(entries.find((entry) => entry.id === "app-admin-settings")?.href).toBe("/admin/course/settings");
	});
});
