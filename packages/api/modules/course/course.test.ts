import { describe, expect, it } from "vitest";
import { resolveVideoSource } from "@startkiter/course/video-resolver";

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

	it("accepts HLS but rejects hostname suffix spoofing and Cloudflare Stream", () => {
		expect(resolveVideoSource("https://media.example.test/lesson.m3u8")).toMatchObject({
			ok: true,
			provider: "HLS",
		});
		expect(resolveVideoSource("https://evilmediadelivery.net/play/library/video")).toMatchObject({
			ok: false,
		});
		expect(resolveVideoSource("https://customer.cloudflarestream.com/video-id/manifest/video.m3u8")).toMatchObject({
			ok: false,
		});
	});

	it("only treats real Bunny player URLs as Bunny and keeps Bunny CDN manifests as HLS", () => {
		expect(resolveVideoSource("https://assets.bunny.net/not-a-player")).toMatchObject({
			ok: false,
		});
		expect(resolveVideoSource("https://vz-abc.b-cdn.net/video/playlist.m3u8")).toMatchObject({
			ok: true,
			provider: "HLS",
		});
	});
});
