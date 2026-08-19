import { validateTimelineRange } from "../../timecode";

export const courseMdxBlockTypes = [
	"TimelineSync",
	"ConceptCompare",
	"MicroSandbox",
	"WorkflowSorter",
	"InstantQuiz",
	"TeacherAvatar",
	"DialogueWindow",
] as const;

export type CourseMdxBlockType = (typeof courseMdxBlockTypes)[number];

type TimelineSyncBlock = {
	id: string;
	type: "TimelineSync";
	props: { at: string; end?: string; title?: string };
};

type ConceptCompareBlock = {
	id: string;
	type: "ConceptCompare";
	props: { tabs: Array<{ title: string; description?: string; code?: string }> };
};

type MicroSandboxBlock = {
	id: string;
	type: "MicroSandbox";
	props: {
		controls: Array<{
			name: string;
			label?: string;
			type: "slider" | "select" | "text";
			default: string | number;
			min?: number;
			max?: number;
			step?: number;
			options?: Array<string | { value: string; label: string }>;
		}>;
		template?: string;
	};
};

type WorkflowSorterBlock = {
	id: string;
	type: "WorkflowSorter";
	props: {
		correctOrder: string[];
		explanation?: string;
		items: Array<string | { id: string; label: string }>;
	};
};

type InstantQuizBlock = {
	id: string;
	type: "InstantQuiz";
	props: {
		answerIndex: number | number[];
		explanation: string;
		multiple?: boolean;
		options: string[];
		question: string;
	};
};

type TeacherAvatarBlock = {
	id: string;
	type: "TeacherAvatar";
	props: { at?: string; caption: string; mood: "explaining" | "encouraging" | "thinking" };
};

type DialogueWindowBlock = {
	id: string;
	type: "DialogueWindow";
	props: { avatar?: boolean; prompts: Array<{ question: string; response: string }> };
};

export type CourseMdxBlock =
	| TimelineSyncBlock
	| ConceptCompareBlock
	| MicroSandboxBlock
	| WorkflowSorterBlock
	| InstantQuizBlock
	| TeacherAvatarBlock
	| DialogueWindowBlock;

export type CourseMdxParseResult =
	| { ok: true; blocks: CourseMdxBlock[]; markdown: string }
	| { ok: false; error: string };

const blockTagPattern = /<([A-Z][A-Za-z0-9]*)\b([^<>]*?)\/>/g;
const attributePattern = /([A-Za-z][A-Za-z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const invalidSourcePattern = /<\s*\/?\s*(?:script|style|iframe|object|embed|i)\b|javascript:|\bon[a-z]+\s*=/i;
const allowedAttributes: Record<CourseMdxBlockType, readonly string[]> = {
	TimelineSync: ["id", "at", "end", "title"],
	ConceptCompare: ["id", "tabs"],
	MicroSandbox: ["id", "controls", "template"],
	WorkflowSorter: ["id", "items", "correctOrder", "explanation"],
	InstantQuiz: ["id", "question", "options", "answerIndex", "explanation", "multiple"],
	TeacherAvatar: ["id", "caption", "mood", "at"],
	DialogueWindow: ["id", "prompts", "avatar"],
};

function fail(error: string): CourseMdxParseResult {
	return { ok: false, error };
}

function asRecord(value: unknown) {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function hasOnlyKeys(record: Record<string, unknown>, keys: readonly string[]) {
	return Object.keys(record).every((key) => keys.includes(key));
}

function isNonEmptyText(value: unknown, maxLength = 2_000): value is string {
	return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function parseAttributes(source: string): Record<string, string> | null {
	const attributes: Record<string, string> = {};
	let match: RegExpExecArray | null;

	attributePattern.lastIndex = 0;
	while ((match = attributePattern.exec(source))) {
		const [, name, doubleQuoted, singleQuoted] = match;
		if (!name || name.toLowerCase().startsWith("on") || name === "style") {
			return null;
		}
		if (attributes[name] !== undefined) {
			return null;
		}
		attributes[name] = doubleQuoted ?? singleQuoted ?? "";
	}

	const remaining = source
		.replace(attributePattern, "")
		.replace(/\s+/g, "")
		.replace(/\//g, "");
	return remaining ? null : attributes;
}

function requiredString(attributes: Record<string, string>, name: string) {
	const value = attributes[name]?.trim();
	return value ? value : null;
}

function optionalString(attributes: Record<string, string>, name: string) {
	const value = attributes[name]?.trim();
	return value || undefined;
}

function parseJsonAttribute(attributes: Record<string, string>, name: string): unknown | null {
	const raw = requiredString(attributes, name);
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function blockId(attributes: Record<string, string>, index: number) {
	const id = optionalString(attributes, "id") ?? "block-" + (index + 1);
	return /^[A-Za-z0-9_-]{1,80}$/.test(id) ? id : null;
}

function parseTimelineSync(
	id: string,
	attributes: Record<string, string>,
): TimelineSyncBlock | null {
	const at = requiredString(attributes, "at");
	if (!at) {
		return null;
	}
	const end = optionalString(attributes, "end");
	try {
		validateTimelineRange({ at, end });
	} catch {
		return null;
	}
	return {
		id,
		type: "TimelineSync",
		props: {
			at,
		end,
			title: optionalString(attributes, "title"),
		},
	};
}

function parseConceptCompare(
	id: string,
	attributes: Record<string, string>,
): ConceptCompareBlock | null {
	const tabs = parseJsonAttribute(attributes, "tabs");
	if (
		!Array.isArray(tabs) ||
		tabs.length === 0 ||
		!tabs.every((tab) => {
			const record = asRecord(tab);
			return Boolean(
				record &&
				hasOnlyKeys(record, ["title", "description", "code"]) &&
				isNonEmptyText(record.title) &&
				(record.description === undefined || typeof record.description === "string") &&
				(record.code === undefined || typeof record.code === "string"),
			);
		})
	) {
		return null;
	}

	return {
		id,
		type: "ConceptCompare",
		props: {
			tabs: tabs.map((tab) => {
				const record = tab as Record<string, unknown>;
				return {
					title: record.title as string,
					...(typeof record.description === "string" ? { description: record.description } : {}),
					...(typeof record.code === "string" ? { code: record.code } : {}),
				};
				})
		},
	};
}

function isSafeSandboxControl(control: unknown) {
	const record = asRecord(control);
	if (
		!record ||
		!hasOnlyKeys(record, ["name", "label", "type", "default", "min", "max", "step", "options"]) ||
		!isNonEmptyText(record.name, 64) ||
		!/^[A-Za-z][A-Za-z0-9_-]*$/.test(record.name) ||
		(record.label !== undefined && typeof record.label !== "string")
	) {
		return false;
	}
	if (record.type === "slider") {
		return (
			typeof record.default === "number" &&
			Number.isFinite(record.default) &&
			(record.min === undefined || (typeof record.min === "number" && Number.isFinite(record.min))) &&
			(record.max === undefined || (typeof record.max === "number" && Number.isFinite(record.max))) &&
			(record.step === undefined || (typeof record.step === "number" && Number.isFinite(record.step) && record.step > 0)) &&
			!(typeof record.min === "number" && typeof record.max === "number" && record.min > record.max)
		);
	}
	if (record.type === "select") {
		return (
			typeof record.default === "string" &&
			Array.isArray(record.options) &&
			record.options.length > 0 &&
				record.options.every((option) => {
				if (isNonEmptyText(option)) {
					return true;
				}
				const optionRecord = asRecord(option);
				return Boolean(
					optionRecord &&
					hasOnlyKeys(optionRecord, ["value", "label"]) &&
					isNonEmptyText(optionRecord.value) &&
					isNonEmptyText(optionRecord.label),
				);
				})
		);
	}
	return record.type === "text" && typeof record.default === "string";
}

function parseMicroSandbox(
	id: string,
	attributes: Record<string, string>,
): MicroSandboxBlock | null {
	const controls = parseJsonAttribute(attributes, "controls");
	if (
		!Array.isArray(controls) ||
		controls.length === 0 ||
		!controls.every(isSafeSandboxControl) ||
		new Set(controls.map((control) => (control as { name: string }).name)).size !== controls.length
	) {
		return null;
	}

	return {
		id,
		type: "MicroSandbox",
		props: {
			controls: controls.map((control) => {
				const record = control as Record<string, unknown>;
				return {
					name: record.name as string,
					type: record.type as "slider" | "select" | "text",
					default: record.default as string | number,
					...(typeof record.label === "string" ? { label: record.label } : {}),
					...(typeof record.min === "number" ? { min: record.min } : {}),
					...(typeof record.max === "number" ? { max: record.max } : {}),
					...(typeof record.step === "number" ? { step: record.step } : {}),
					...(Array.isArray(record.options) ? { options: record.options as MicroSandboxBlock["props"]["controls"][number]["options"] } : {}),
				};
			}),
			template: optionalString(attributes, "template"),
		},
	};
}

function parseWorkflowSorter(
	id: string,
	attributes: Record<string, string>,
): WorkflowSorterBlock | null {
	const items = parseJsonAttribute(attributes, "items");
	const correctOrder = parseJsonAttribute(attributes, "correctOrder");
	if (
		!Array.isArray(items) ||
		items.length === 0 ||
		!items.every(
			(item) =>
				isNonEmptyText(item) ||
				Boolean(
					asRecord(item) &&
					hasOnlyKeys(asRecord(item)!, ["id", "label"]) &&
					isNonEmptyText(asRecord(item)?.id) &&
					isNonEmptyText(asRecord(item)?.label),
				),
		) ||
		!Array.isArray(correctOrder) ||
		!correctOrder.every((item) => isNonEmptyText(item))
	) {
		return null;
	}
	const itemIds = items.map((item) => (typeof item === "string" ? item : (item as { id: string }).id));
	if (
		new Set(itemIds).size !== itemIds.length ||
		correctOrder.length !== itemIds.length ||
		new Set(correctOrder).size !== correctOrder.length ||
		correctOrder.some((item) => !itemIds.includes(item))
	) {
		return null;
	}

	return {
		id,
		type: "WorkflowSorter",
		props: {
			items: items as WorkflowSorterBlock["props"]["items"],
			correctOrder: correctOrder as string[],
			explanation: optionalString(attributes, "explanation"),
		},
	};
}

function parseInstantQuiz(
	id: string,
	attributes: Record<string, string>,
): InstantQuizBlock | null {
	const question = requiredString(attributes, "question");
	const explanation = requiredString(attributes, "explanation");
	const options = parseJsonAttribute(attributes, "options");
	const answerRaw = requiredString(attributes, "answerIndex");
	if (
		!question ||
		!explanation ||
		!Array.isArray(options) ||
		options.length < 2 ||
		!options.every((option) => isNonEmptyText(option)) ||
		!answerRaw
	) {
		return null;
	}

	let answerIndex: number | number[];
	if (answerRaw.startsWith("[")) {
		try {
			const parsed = JSON.parse(answerRaw);
			if (
				!Array.isArray(parsed) ||
				parsed.length === 0 ||
				!parsed.every((index) => Number.isInteger(index) && index >= 0 && index < options.length) ||
				new Set(parsed).size !== parsed.length
			) {
				return null;
			}
			answerIndex = parsed;
		} catch {
			return null;
		}
	} else {
		const parsed = Number(answerRaw);
		if (!Number.isInteger(parsed) || parsed < 0 || parsed >= options.length) {
			return null;
		}
		answerIndex = parsed;
	}
	if (attributes.multiple !== undefined && attributes.multiple !== "true" && attributes.multiple !== "false") {
		return null;
	}

	return {
		id,
		type: "InstantQuiz",
		props: {
			question,
			explanation,
			options: options as string[],
			answerIndex,
			multiple: attributes.multiple === "true",
		},
	};
}

function parseTeacherAvatar(
	id: string,
	attributes: Record<string, string>,
): TeacherAvatarBlock | null {
	const caption = requiredString(attributes, "caption");
	const mood = optionalString(attributes, "mood") ?? "explaining";
	const at = optionalString(attributes, "at");
	if (!caption || !["explaining", "encouraging", "thinking"].includes(mood)) {
		return null;
	}
	if (at) {
		try {
			validateTimelineRange({ at });
		} catch {
			return null;
		}
	}
	return {
		id,
		type: "TeacherAvatar",
		props: {
			caption,
			mood: mood as TeacherAvatarBlock["props"]["mood"],
			at,
		},
	};
}

function parseDialogueWindow(
	id: string,
	attributes: Record<string, string>,
): DialogueWindowBlock | null {
	const prompts = parseJsonAttribute(attributes, "prompts");
	if (
		!Array.isArray(prompts) ||
		prompts.length === 0 ||
		!prompts.every((prompt) => {
			const record = asRecord(prompt);
			return Boolean(
				record &&
				hasOnlyKeys(record, ["question", "answer"]) &&
				isNonEmptyText(record.question) &&
				isNonEmptyText(record.answer),
			);
		})
	) {
		return null;
	}
	if (attributes.avatar !== undefined && attributes.avatar !== "true" && attributes.avatar !== "false") {
		return null;
	}

	return {
		id,
		type: "DialogueWindow",
		props: {
			avatar: attributes.avatar === "true",
			prompts: prompts.map((prompt) => {
				const record = prompt as Record<string, string>;
				return { question: record.question, response: record.answer };
			}),
		},
	};
}

function parseBlock(
	type: string,
	attributes: Record<string, string>,
	index: number,
): CourseMdxBlock | null {
	const id = blockId(attributes, index);
	if (!id || !courseMdxBlockTypes.includes(type as CourseMdxBlockType)) {
		return null;
	}
	if (!Object.keys(attributes).every((name) => allowedAttributes[type as CourseMdxBlockType].includes(name))) {
		return null;
	}

	switch (type as CourseMdxBlockType) {
		case "TimelineSync":
			return parseTimelineSync(id, attributes);
		case "ConceptCompare":
			return parseConceptCompare(id, attributes);
		case "MicroSandbox":
			return parseMicroSandbox(id, attributes);
		case "WorkflowSorter":
			return parseWorkflowSorter(id, attributes);
		case "InstantQuiz":
			return parseInstantQuiz(id, attributes);
		case "TeacherAvatar":
			return parseTeacherAvatar(id, attributes);
		case "DialogueWindow":
			return parseDialogueWindow(id, attributes);
	}
}

/**
 * This is deliberately not a general-purpose MDX compiler. Stored lessons accept
 * Markdown plus the seven fixed self-closing components only, so untrusted JSX,
 * HTML, imports and event handlers cannot execute in the learner browser.
 */
export function parseCourseMdx(source: string | null | undefined): CourseMdxParseResult {
	const content = source?.trim() ?? "";
	if (!content) {
		return { ok: true, blocks: [], markdown: "" };
	}
	if (invalidSourcePattern.test(content)) {
		return fail("Course content contains disallowed HTML or event handlers.");
	}

	const blocks: CourseMdxBlock[] = [];
	let cursor = 0;
	let match: RegExpExecArray | null;
	blockTagPattern.lastIndex = 0;

	while ((match = blockTagPattern.exec(content))) {
		const before = content.slice(cursor, match.index);
		if (before.includes("<") || before.includes(">")) {
			return fail("Course content contains unsupported raw HTML.");
		}
		const type = match[1] ?? "";
		const attributes = parseAttributes(match[2] ?? "");
		const block = attributes ? parseBlock(type, attributes, blocks.length) : null;
		if (!block) {
			return fail("Course content contains an invalid or unregistered interactive block.");
		}
		if (blocks.some((item) => item.id === block.id)) {
			return fail("Course content contains duplicate interactive block ids.");
		}
		blocks.push(block);
		cursor = blockTagPattern.lastIndex;
	}

	const trailing = content.slice(cursor);
	if (trailing.includes("<") || trailing.includes(">")) {
		return fail("Course content contains unsupported raw HTML.");
	}

	return {
		ok: true,
		blocks,
		markdown: content.replace(blockTagPattern, "").trim(),
	};
}

/** Validates timeline blocks against the media duration before a lesson is published. */
export function validateCourseMdx(
	source: string | null | undefined,
	options: { durationSeconds?: number } = {},
): CourseMdxParseResult {
	const parsed = parseCourseMdx(source);
	if (!parsed.ok) {
		return parsed;
	}

	try {
		for (const block of parsed.blocks) {
			if (block.type === "TimelineSync") {
				validateTimelineRange({
					at: block.props.at,
					durationSeconds: options.durationSeconds,
					end: block.props.end,
				});
			}
		}
		return parsed;
	} catch (error) {
		return fail(error instanceof Error ? error.message : "Course timecode is invalid.");
	}
}
