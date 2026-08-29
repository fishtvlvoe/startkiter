import { describe, expect, it, vi } from "vitest";

import { processVideoUploads, uploadVideoToBunny } from "./bunny-uploader";

function video(name: string, size: number): File {
	return { name, size, arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(size)) } as unknown as File;
}

describe("Bunny video uploader", () => {
	it("creates and uploads a video, returning its Bunny id and duration", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response(JSON.stringify({ guid: "video-1" }), { status: 201 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ length: 42 }), { status: 200 }));

		await expect(
			uploadVideoToBunny(video("lesson.mp4", 10), {
				apiKey: "bunny-key",
				libraryId: "library-1",
				fetchImpl: fetchMock,
				maxFileSizeBytes: 100,
			}),
		).resolves.toEqual({ bunnyVideoId: "video-1", duration: 42 });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("rejects only oversized videos and continues processing other lessons", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response(JSON.stringify({ guid: "video-ok" }), { status: 201 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ length: 12 }), { status: 200 }));

		const results = await processVideoUploads(
			[
				{ lessonId: "too-large", file: video("large.mp4", 101) },
				{ lessonId: "small", file: video("small.mp4", 10) },
			],
			{
				apiKey: "bunny-key",
				libraryId: "library-1",
				fetchImpl: fetchMock,
				maxFileSizeBytes: 100,
			},
		);

		expect(results).toEqual([
			{ lessonId: "too-large", ok: false, error: "FILE_TOO_LARGE" },
			{ lessonId: "small", ok: true, bunnyVideoId: "video-ok", duration: 12 },
		]);
	});
});
