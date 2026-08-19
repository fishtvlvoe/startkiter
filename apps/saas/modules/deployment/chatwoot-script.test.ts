import { beforeEach, describe, expect, it, vi } from "vitest";
import { initChatwootSdk, syncChatwootUser } from "../../app/(authenticated)/ChatwootScript";

describe("ChatwootScript - SDK Initialization & User Sync", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		// Mock DOM environment for unit testing
		const mockScripts: Record<string, unknown> = {};
		const mockBody = {
			appendChild: vi.fn((el: { id: string }) => {
				mockScripts[el.id] = el;
				return el;
			}),
		};

		(globalThis as unknown as { window: unknown }).window = {
			chatwootSDK: {
				run: vi.fn(),
			},
			$chatwoot: {
				setUser: vi.fn(),
				setCustomAttributes: vi.fn(),
				toggle: vi.fn(),
			},
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		};

		(globalThis as unknown as { document: unknown }).document = {
			getElementById: vi.fn((id: string) => mockScripts[id] || null),
			createElement: vi.fn(() => ({
				id: "",
				src: "",
				defer: false,
				async: false,
				onload: null as (() => void) | null,
			})),
			body: mockBody,
		};
	});

	it("returns false and gracefully degrades when websiteToken is not provided or empty", () => {
		expect(initChatwootSdk({ websiteToken: undefined })).toBe(false);
		expect(initChatwootSdk({ websiteToken: "" })).toBe(false);
		expect(document.createElement).not.toHaveBeenCalled();
	});

	it("injects Chatwoot SDK script with custom baseUrl and websiteToken when provided", () => {
		const result = initChatwootSdk({
			websiteToken: "cw_token_test_123",
			baseUrl: "https://chat.example.com",
		});

		expect(result).toBe(true);
		expect(document.createElement).toHaveBeenCalledWith("script");
		expect(document.body.appendChild).toHaveBeenCalled();
	});

	it("does not re-inject SDK script if already present in DOM", () => {
		// Mock existing script
		vi.spyOn(document, "getElementById").mockReturnValue({} as HTMLElement);

		const result = initChatwootSdk({
			websiteToken: "cw_token_test_123",
		});

		expect(result).toBe(true);
		expect(document.createElement).not.toHaveBeenCalled();
	});

	it("syncs user id, email, name, and avatar to Chatwoot $chatwoot", () => {
		const user = {
			id: "usr_456",
			email: "fish@startkiter.com",
			name: "Fish",
			image: "https://avatar.startkiter.com/fish.png",
		};

		const synced = syncChatwootUser(user);

		expect(synced).toBe(true);
		expect(window.$chatwoot?.setUser).toHaveBeenCalledWith("usr_456", {
			name: "Fish",
			email: "fish@startkiter.com",
			avatar_url: "https://avatar.startkiter.com/fish.png",
		});
	});

	it("falls back to email for name when user name is not set", () => {
		const user = {
			id: "usr_789",
			email: "buyer@startkiter.com",
			name: null,
			image: null,
		};

		const synced = syncChatwootUser(user);

		expect(synced).toBe(true);
		expect(window.$chatwoot?.setUser).toHaveBeenCalledWith("usr_789", {
			name: "buyer@startkiter.com",
			email: "buyer@startkiter.com",
			avatar_url: undefined,
		});
	});

	it("returns false when user is null or undefined", () => {
		expect(syncChatwootUser(null)).toBe(false);
		expect(syncChatwootUser(undefined)).toBe(false);
		expect(window.$chatwoot?.setUser).not.toHaveBeenCalled();
	});

	it("returns false when window.$chatwoot is not yet available", () => {
		(globalThis as unknown as { window: { $chatwoot?: unknown } }).window.$chatwoot = undefined;

		expect(syncChatwootUser({ id: "usr_1" })).toBe(false);
	});
});
