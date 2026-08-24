export type SubmissionRulesInput = {
	submittedAt: Date;
	dueAt: Date | null;
	content: string;
	minWords: number;
	maxWords: number;
	fileCount: number;
	maxFiles: number;
};

export type SubmissionRules = {
	isLate: boolean;
	contentError: string | null;
	fileError: string | null;
};

export function countAssignmentWords(content: string): number {
	return content
		.replace(/<[^>]*>/g, " ")
		.trim()
		.split(/\s+/u)
		.filter(Boolean).length;
}

export function calculateSubmissionRules(input: SubmissionRulesInput): SubmissionRules {
	const wordCount = countAssignmentWords(input.content);
	return {
		isLate: input.dueAt !== null && input.submittedAt.getTime() > input.dueAt.getTime(),
		contentError: wordCount < input.minWords
			? `內容至少需要 ${input.minWords} 字。`
			: wordCount > input.maxWords
				? `內容不可超過 ${input.maxWords} 字。`
				: null,
		fileError: input.fileCount > input.maxFiles ? `最多只能上傳 ${input.maxFiles} 個檔案。` : null,
	};
}

export function incrementRevisionNumber(current: number): number {
	return Math.max(1, Math.floor(current) + 1);
}
