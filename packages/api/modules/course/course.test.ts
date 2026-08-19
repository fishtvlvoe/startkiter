import { describe, expect, it } from "vitest";
import { resolveVideoSource } from "./lib/video-resolver";

describe("Course Video Resolver (Fluent Player)", () => {
	it("correctly identifies Bunny Stream URLs", () => {
		const res = resolveVideoSource("https://iframe.mediadelivery.net/play/12345/bunny-demo");
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.provider).toBe("BUNNY");
			expect(res.sourceId).toBe("12345/bunny-demo");
		}
	});

	it("correctly identifies YouTube URLs", () => {
		const res = resolveVideoSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.provider).toBe("YOUTUBE");
			expect(res.sourceId).toBe("dQw4w9WgXcQ");
		}
	});

	it("correctly identifies Vimeo URLs", () => {
		const res = resolveVideoSource("https://vimeo.com/123456789");
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.provider).toBe("VIMEO");
			expect(res.sourceId).toBe("123456789");
		}
	});

	it("correctly identifies direct HTTPS MP4 URLs", () => {
		const res = resolveVideoSource("https://example.com/videos/lesson1.mp4");
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.provider).toBe("CUSTOM_MP4");
		}
	});

	it("rejects unknown or insecure HTTP URLs (fail-closed)", () => {
		const insecureRes = resolveVideoSource("http://example.com/video.mp4");
		expect(insecureRes.ok).toBe(false);

		const unknownRes = resolveVideoSource("https://unsupported-site.com/watch");
		expect(unknownRes.ok).toBe(false);
	});
});
