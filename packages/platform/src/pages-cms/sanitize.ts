import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

export const ALLOWED_PAGE_TAGS = [
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"ul",
	"ol",
	"li",
	"a",
	"img",
	"strong",
	"em",
	"blockquote",
	"code",
] as const;

const ALLOWED_ATTR = ["href", "src", "alt"];

const SAFE_URI =
	/^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

export type SanitizeResult = {
	html: string;
	warnings: string[];
};

export function sanitizePageBody(html: string): SanitizeResult {
	const warnings: string[] = [];
	const allowedTagSet = new Set<string>(ALLOWED_PAGE_TAGS);

	DOMPurify.removeAllHooks();
	const ignoredTags = new Set(["html", "head", "body", "#text", "#comment"]);
	DOMPurify.addHook("uponSanitizeElement", (_node, data) => {
		const tagName = data.tagName.toLowerCase();
		if (tagName && !allowedTagSet.has(tagName) && !ignoredTags.has(tagName)) {
			warnings.push(`removed tag: ${tagName}`);
		}
	});
	DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
		const attrName = data.attrName.toLowerCase();
		if (!ALLOWED_ATTR.includes(attrName) || data.keepAttr === false) {
			warnings.push(`removed attribute: ${attrName}`);
			return;
		}
		if (
			(attrName === "href" || attrName === "src") &&
			typeof data.attrValue === "string" &&
			!SAFE_URI.test(data.attrValue)
		) {
			warnings.push(`removed attribute: ${attrName}`);
		}
	});

	const sanitized = DOMPurify.sanitize(html, {
		ALLOWED_TAGS: [...ALLOWED_PAGE_TAGS],
		ALLOWED_ATTR,
		FORBID_ATTR: ["style"],
		ALLOW_DATA_ATTR: false,
		ALLOWED_URI_REGEXP: SAFE_URI,
		KEEP_CONTENT: true,
	});

	DOMPurify.removeAllHooks();

	return {
		html: sanitized,
		warnings: [...new Set(warnings)],
	};
}
