import { describe, expect, it } from "vitest";

import { getMessagesForLocale } from "./i18n";

describe("mail i18n fallback", () => {
	it("falls back to zh-tw when the locale is unknown", async () => {
		const zhTw = await getMessagesForLocale("zh-tw");
		const fallback = await getMessagesForLocale("not-a-locale" as never);

		expect(fallback.notification.subject).toBe(zhTw.notification.subject);
		expect(fallback.notification.view).toBe(zhTw.notification.view);
		expect(fallback).toEqual(zhTw);
	});

	it("keeps zh-tw keys when a locale catalog omits them via merge", async () => {
		const zhTw = await getMessagesForLocale("zh-tw");
		const en = await getMessagesForLocale("en");

		expect(en.notification.subject).toBeTruthy();
		expect(zhTw.notification.subject).toBeTruthy();
		expect(en.notification).toEqual(expect.objectContaining(zhTw.notification));
	});
});
