import { describe, expect, it } from "vitest";

import { parseFileList } from "./folder-parser";

function file(name: string, webkitRelativePath: string): File {
	return { name, webkitRelativePath } as File;
}

function fileList(files: File[]): FileList {
	return Object.assign(files, { item: (index: number) => files[index] ?? null }) as FileList;
}

describe("parseFileList", () => {
	it("parses a naturally ordered three-level course structure", () => {
		const result = parseFileList(
			fileList([
				file("video.mp4", "Course/02 Chapter/02 Lesson/video.mp4"),
				file("notes.md", "Course/02 Chapter/02 Lesson/notes.md"),
				file("video.mp4", "Course/01 Chapter/02 Lesson/video.mp4"),
				file("subtitle.srt", "Course/01 Chapter/02 Lesson/subtitle.srt"),
				file("video.mp4", "Course/01 Chapter/01 Lesson/video.mp4"),
				file("notes.md", "Course/01 Chapter/01 Lesson/notes.md"),
				file("video.mp4", "Course/02 Chapter/01 Lesson/video.mp4"),
				file("subtitle.srt", "Course/02 Chapter/01 Lesson/subtitle.srt"),
			]),
		);

		expect(result).toMatchObject([
			{
				name: "01 Chapter",
				lessons: [{ name: "01 Lesson" }, { name: "02 Lesson" }],
			},
			{
				name: "02 Chapter",
				lessons: [{ name: "01 Lesson" }, { name: "02 Lesson" }],
			},
		]);
	});

	it("keeps incomplete lessons and reports missing content warnings", () => {
		const result = parseFileList(
			fileList([
				file("video.mp4", "Course/Chapter/Lesson without notes/video.mp4"),
				file("subtitle.srt", "Course/Chapter/Lesson without video/subtitle.srt"),
			]),
		);

		expect(result).toMatchObject([
			{
				lessons: [
					{ name: "Lesson without notes", warnings: ["MISSING_NOTES_OR_SUBTITLE"] },
					{ name: "Lesson without video", warnings: ["MISSING_VIDEO"] },
				],
			},
		]);
	});

	it("ignores files outside the exact four-segment file path", () => {
		const result = parseFileList(
			fileList([
				file("root.mp4", "Course/root.mp4"),
				file("too-shallow.mp4", "Course/Chapter/too-shallow.mp4"),
				file("too-deep.mp4", "Course/Chapter/Lesson/Extra/too-deep.mp4"),
				file("video.mp4", "Course/Chapter/Valid Lesson/video.mp4"),
			]),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.lessons).toHaveLength(1);
		expect(result[0]?.lessons[0]?.name).toBe("Valid Lesson");
	});
});
