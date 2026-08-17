// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { OrganizationSelect } from "../app/components/organization-select";
import type { OrganizationRecord } from "./organization";

const organizations: readonly OrganizationRecord[] = [
	{
		id: "org-startkiter",
		slug: "startkiter",
		name: "StartKiter",
		member: { id: "member-a", userId: "user-a", role: "owner" },
	},
	{
		id: "org-client",
		slug: "client",
		name: "客戶組織",
		member: { id: "member-b", userId: "user-a", role: "instructor" },
	},
];

describe("OrganizationSelect", () => {
	let container: HTMLDivElement;
	let root: Root;

	afterEach(() => {
		act(() => root?.unmount());
		document.body.replaceChildren();
	});

	function render(element: React.ReactElement) {
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container);
		act(() => root.render(element));
		return container;
	}

	it("shows the switcher for a user with multiple organizations", () => {
		const container = render(
			<OrganizationSelect organizations={organizations} activeOrganizationId="org-startkiter" />,
		);

		expect(container.querySelector('[data-slot="organization-select-trigger"]')).toBeTruthy();
		expect(container.textContent).toContain("StartKiter");

		act(() => {
			container.querySelector<HTMLButtonElement>('[data-slot="organization-select-trigger"]')?.click();
		});
		expect(document.body.textContent).toContain("客戶組織");
	});

	it("does not show the switcher for a user with one organization", () => {
		const container = render(
			<OrganizationSelect organizations={[organizations[0]]} activeOrganizationId="org-startkiter" />,
		);

		expect(container.firstChild).toBeNull();
	});

	it("updates the active data scope after switching organizations", () => {
		const onOrganizationChange = vi.fn();
		const container = render(
			<OrganizationSelect
				organizations={organizations}
				activeOrganizationId="org-startkiter"
				onOrganizationChange={onOrganizationChange}
			/>,
		);

		const trigger = container.querySelector<HTMLButtonElement>('[data-slot="organization-select-trigger"]');
		act(() => {
			trigger?.click();
		});
		const clientOption = document.body.querySelector('[data-organization-id="org-client"]') as HTMLElement;
		act(() => {
			clientOption?.click();
		});

		expect(onOrganizationChange).toHaveBeenCalledWith(organizations[1]);
		expect(onOrganizationChange).toHaveBeenCalledTimes(1);
		expect(container.querySelector('[data-testid="organization-scope"]')?.getAttribute("data-active-organization-id")).toBe(
			"org-client",
		);
	});
});
