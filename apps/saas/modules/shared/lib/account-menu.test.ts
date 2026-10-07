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
			["upgrade", "logout"],
		],
		[
			"app, app-user (platformAdmin: true)",
			{ scope: "app", appId: "course", role: "app-user" } as const,
			true,
			["platform-admin-settings", "upgrade", "logout"],
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

	it("does not contain app-admin-settings dead link for course instructor", () => {
		const entries = getAccountMenuEntries(
			{ scope: "app", appId: "course", role: "app-admin" },
			{ platformAdmin: false },
		);
		expect(entries.some((entry: any) => entry.id === "app-admin-settings")).toBe(false);
	});
});
