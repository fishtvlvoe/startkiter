export type ParsedWarning = "MISSING_VIDEO" | "MISSING_NOTES_OR_SUBTITLE";

export interface ParsedLesson {
	name: string;
	video?: File;
	subtitle?: File;
	notes?: File;
	warnings: ParsedWarning[];
}

export interface ParsedChapter {
	name: string;
	lessons: ParsedLesson[];
}

type LessonFiles = {
	video?: File;
	subtitle?: File;
	notes?: File;
};

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov"]);

export function parseFileList(files: FileList): ParsedChapter[] {
	const chapters = new Map<string, Map<string, LessonFiles>>();

	for (let index = 0; index < files.length; index += 1) {
		const file = files.item(index);
		if (!file) continue;

		const path = file.webkitRelativePath.split("/").filter(Boolean);
		if (path.length !== 4) continue;

		const [, chapterName, lessonName] = path;
		if (!chapterName || !lessonName) continue;

		const lessons = chapters.get(chapterName) ?? new Map<string, LessonFiles>();
		const lessonFiles = lessons.get(lessonName) ?? {};
		const extension = getExtension(file.name);

		if (VIDEO_EXTENSIONS.has(extension)) lessonFiles.video ??= file;
		else if (extension === ".srt") lessonFiles.subtitle ??= file;
		else if (extension === ".md") lessonFiles.notes ??= file;

		if (lessonFiles.video || lessonFiles.subtitle || lessonFiles.notes) {
			lessons.set(lessonName, lessonFiles);
			chapters.set(chapterName, lessons);
		}
	}

	return [...chapters.entries()]
		.sort(([left], [right]) => naturalCompare(left, right))
		.map(([name, lessons]) => ({
			name,
			lessons: [...lessons.entries()]
				.sort(([left], [right]) => naturalCompare(left, right))
				.map(([lessonName, lessonFiles]) => ({
					name: lessonName,
					...lessonFiles,
					warnings: buildWarnings(lessonFiles),
				})),
		}));
}

function buildWarnings(files: LessonFiles): ParsedWarning[] {
	const warnings: ParsedWarning[] = [];
	if (!files.video) warnings.push("MISSING_VIDEO");
	if (!files.notes && !files.subtitle) warnings.push("MISSING_NOTES_OR_SUBTITLE");
	return warnings;
}

function getExtension(filename: string): string {
	const dotIndex = filename.lastIndexOf(".");
	return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

function naturalCompare(left: string, right: string): number {
	return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}
