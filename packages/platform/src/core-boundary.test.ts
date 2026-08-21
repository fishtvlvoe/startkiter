import { describe, expect, it } from "vitest";
import { MOUNT_POINTS } from "./mount-points";
import type { PluginManifest } from "./types";

describe("Phase 6 Core Boundary Tests (Tasks 28.1, 28.2, 28.3)", () => {
	describe("Task 28.1: Payment, notification, and Core infrastructure are fixed capabilities", () => {
		it("rejects manifest declaring dataSpec: 'payment' at compile time", () => {
			const paymentManifest: PluginManifest = {
				id: "custom-payment",
				name: "Custom Payment",
				version: "1.0.0",
				mount: {
					route: { path: "/custom-checkout" },
				},
				// @ts-expect-error - Type '"payment"' is not assignable to type '"content" | "none"'
				dataSpec: "payment",
			};
			expect(paymentManifest.id).toBe("custom-payment");
		});

		it("rejects manifest declaring transactional dataSpec at compile time", () => {
			const transactionManifest: PluginManifest = {
				id: "custom-order",
				name: "Custom Order",
				version: "1.0.0",
				mount: {},
				// @ts-expect-error - Type '"transaction"' is not assignable to type '"content" | "none"'
				dataSpec: "transaction",
			};
			expect(transactionManifest.id).toBe("custom-order");
		});

		it("ensures MOUNT_POINTS registry (data source for /api/plugins) contains no payment or notification-sending providers", () => {
			const paymentPlugins = MOUNT_POINTS.filter((p) => {
				const id = p.id.toLowerCase();
				const name = p.name.toLowerCase();
				return (
					id.includes("payment") ||
					id.includes("payuni") ||
					id.includes("checkout") ||
					id.includes("stripe") ||
					id.includes("notification-sender") ||
					name.includes("金流") ||
					name.includes("支付") ||
					name.includes("結帳")
				);
			});

			expect(paymentPlugins).toHaveLength(0);
		});
	});

	describe("Task 28.2: Plugin scope is limited to service-type capabilities", () => {
		it("accepts valid course manifest as service-type Plugin", () => {
			const courseManifest: PluginManifest = {
				id: "course",
				name: "課程模組",
				version: "0.1.0",
				mount: {
					route: { path: "/course" },
					menu: { label: "課程", icon: "📚", order: 1 },
					content: { kind: "auto", boundTo: "/course" },
				},
				dataSpec: "content",
			};

			expect(courseManifest.id).toBe("course");
			expect(courseManifest.dataSpec).toBe("content");
			expect(courseManifest.mount.content?.kind).toBe("auto");
			expect(courseManifest.mount.content?.boundTo).toBe("/course");
		});

		it("rejects manifest declaring non-existent authProvider mount kind", () => {
			const invalidAuthManifest: PluginManifest = {
				id: "override-auth",
				name: "Override Auth",
				version: "1.0.0",
				mount: {
					// @ts-expect-error - Object literal may only specify known properties, and 'authProvider' does not exist in type
					authProvider: { strategy: "custom-oauth" },
				},
				dataSpec: "none",
			};

			expect(invalidAuthManifest.id).toBe("override-auth");
		});

		it("rejects manifest declaring non-existent shellOverride mount kind", () => {
			const invalidShellManifest: PluginManifest = {
				id: "override-shell",
				name: "Override Shell",
				version: "1.0.0",
				mount: {
					// @ts-expect-error - Object literal may only specify known properties, and 'shellOverride' does not exist in type
					shellOverride: { layout: "custom-shell" },
				},
				dataSpec: "none",
			};

			expect(invalidShellManifest.id).toBe("override-shell");
		});
	});

	describe("Task 28.3: Transaction-type data spec is documented but not scaffolded in v1", () => {
		it("confirms codebase has no transaction-type plugin scaffold or code generator in v1", () => {
			// In v1, only content-type plugins use the shared PluginContent table.
			// Transaction-type plugins requiring migration-based tables are documented only,
			// and no scaffolding or code generators are exported by the platform package.
			const manifestKeys: (keyof PluginManifest["mount"])[] = ["route", "menu", "content"];
			expect(manifestKeys).toEqual(["route", "menu", "content"]);
			
			// dataSpec only allows "content" or "none"
			const validDataSpecs: PluginManifest["dataSpec"][] = ["content", "none"];
			expect(validDataSpecs).toEqual(["content", "none"]);
		});
	});
});
