import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/course/demo-video", () => {
	const fetchMock = vi.fn();

	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock);
		fetchMock.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("proxies range requests with same-origin video headers", async () => {
		fetchMock.mockResolvedValue(
			new Response("video bytes", {
				status: 206,
				headers: {
					"content-range": "bytes 0-10/11",
					"content-length": "11",
				},
			}),
		);

		const response = await GET(
			new Request("https://app.startkiter.dev/api/course/demo-video", {
				headers: { range: "bytes=0-10" },
			}),
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
			{ headers: { range: "bytes=0-10" } },
		);
		expect(response.status).toBe(206);
		expect(response.headers.get("content-type")).toBe("video/mp4");
		expect(response.headers.get("cross-origin-resource-policy")).toBe("same-origin");
		expect(await response.text()).toBe("video bytes");
	});

	it("returns a gateway error when the upstream video is unavailable", async () => {
		fetchMock.mockRejectedValue(new Error("upstream unavailable"));

		const response = await GET(new Request("https://app.startkiter.dev/api/course/demo-video"));

		expect(response.status).toBe(502);
	});
});
