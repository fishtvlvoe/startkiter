import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

export function sanitizeAssignmentContent(content: string): string {
	return DOMPurify.sanitize(content, {
		ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "blockquote"],
		ALLOWED_ATTR: ["href", "target", "rel"],
		FORBID_ATTR: ["style"],
		ALLOW_DATA_ATTR: false,
		ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
	});
}
