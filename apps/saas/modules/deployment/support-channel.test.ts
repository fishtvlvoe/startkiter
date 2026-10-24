import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildSupportMailto,
	getSupportEmail,
} from "./support-channel";

const ORIGINAL_ENV = { ...process.env };

describe("support-channel: 收件信箱", () => {
	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
	});

	it("讀 NEXT_PUBLIC_SUPPORT_EMAIL", () => {
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "fish@fishot.com");
		expect(getSupportEmail()).toBe("fish@fishot.com");
	});

	it("未設定時回傳 null，呼叫端要自己處理", () => {
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "");
		expect(getSupportEmail()).toBeNull();
	});
});

describe("support-channel: mailto 組裝", () => {
	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
	});

	it("組出帶主旨與內文的 mailto 連結", () => {
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "fish@fishot.com");
		const href = buildSupportMailto({ subject: "客服諮詢", body: "我的網站掛了" });
		expect(href).not.toBeNull();
		expect(href!.startsWith("mailto:fish@fishot.com?")).toBe(true);
		expect(href).toContain(`subject=${encodeURIComponent("客服諮詢")}`);
		expect(href).toContain(`body=${encodeURIComponent("我的網站掛了")}`);
	});

	it("內文含部署資訊時完整帶入且正確編碼", () => {
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "fish@fishot.com");
		const href = buildSupportMailto({
			subject: "客服諮詢",
			body: "部署 ID：dep_abc123\n網址：https://buyer.example.com",
		});
		expect(href).toContain(encodeURIComponent("dep_abc123"));
		expect(href).toContain(encodeURIComponent("https://buyer.example.com"));
	});

	it("沒設定收件信箱時回傳 null，不產生壞掉的 mailto:", () => {
		vi.stubEnv("NEXT_PUBLIC_SUPPORT_EMAIL", "");
		expect(buildSupportMailto({ subject: "客服諮詢", body: "x" })).toBeNull();
	});
});
