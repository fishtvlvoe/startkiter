import React from "react";
import { describe, expect, it } from "vitest";

import { DropdownMenuContent } from "./dropdown-menu";

describe("DropdownMenuContent", () => {
	it("uses an opaque popover background for overlay content", () => {
		const portal = DropdownMenuContent({ children: "內容" });
		const positioner = portal.props.children as React.ReactElement;
		const popup = positioner.props.children as React.ReactElement;

		expect(popup.props.className).toContain("bg-popover/100");
	});
});
