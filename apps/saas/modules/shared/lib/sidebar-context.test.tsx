import Cookies from "js-cookie";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarProvider, useSidebar } from "./sidebar-context";

vi.mock("js-cookie", () => ({
	default: {
		get: vi.fn(),
		set: vi.fn(),
	},
}));

function TestConsumer({ onContext }: { onContext?: (ctx: ReturnType<typeof useSidebar>) => void }) {
	const context = useSidebar();
	if (onContext) {
		onContext(context);
	}
	return <div data-testid="consumer">{context.isCollapsed ? "collapsed" : "expanded"}</div>;
}

describe("SidebarContext (Task 50.1 / Task 6.2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws an error when useSidebar is called outside SidebarProvider", () => {
		expect(() => {
			renderToStaticMarkup(<TestConsumer />);
		}).toThrow("useSidebar must be used within a SidebarProvider");
	});

	it("provides default isCollapsed=false when rendered inside SidebarProvider", () => {
		let capturedContext: ReturnType<typeof useSidebar> | null = null;
		const html = renderToStaticMarkup(
			<SidebarProvider>
				<TestConsumer
					onContext={(ctx) => {
						capturedContext = ctx;
					}}
				/>
			</SidebarProvider>,
		);

		expect(html).toContain("expanded");
		if (!capturedContext) {
			throw new Error("Expected context to be captured");
		}
		const ctx = capturedContext as ReturnType<typeof useSidebar>;
		expect(ctx.isCollapsed).toBe(false);
		expect(typeof ctx.setIsCollapsed).toBe("function");
		expect(typeof ctx.toggleCollapsed).toBe("function");
	});

	it("manages cookie state persistence on setIsCollapsed and toggleCollapsed", () => {
		let capturedContext: ReturnType<typeof useSidebar> | null = null;
		renderToStaticMarkup(
			<SidebarProvider>
				<TestConsumer
					onContext={(ctx) => {
						capturedContext = ctx;
					}}
				/>
			</SidebarProvider>,
		);

		if (!capturedContext) {
			throw new Error("Expected context to be captured");
		}
		const ctx = capturedContext as ReturnType<typeof useSidebar>;
		ctx.setIsCollapsed(true);
		expect(Cookies.set).toHaveBeenCalledWith("sidebar-collapsed", "true", { expires: 365 });

		ctx.setIsCollapsed(false);
		expect(Cookies.set).toHaveBeenCalledWith("sidebar-collapsed", "false", { expires: 365 });

		ctx.toggleCollapsed();
		expect(Cookies.set).toHaveBeenCalledWith("sidebar-collapsed", "true", { expires: 365 });
	});
});
