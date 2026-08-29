import { describe, expect, it } from "vitest";

import { sanitizePageBody } from "./sanitize";

describe("sanitizePageBody (Requirement: Content is sanitized before storage)", () => {
	it("strips <script> tags and reports a warning", () => {
		const result = sanitizePageBody("<p>ok</p><script>alert(1)</script>");

		expect(result.html).not.toMatch(/<script/i);
		expect(result.html).not.toContain("alert(1)");
		expect(result.html).toContain("<p>ok</p>");
		expect(result.warnings.length).toBeGreaterThan(0);
	});

	it("removes onerror attributes while keeping a safe img tag", () => {
		const result = sanitizePageBody('<img src="https://example.com/x.png" onerror=alert(1)>');

		expect(result.html).not.toMatch(/onerror/i);
		expect(result.html).not.toContain("alert(1)");
		expect(result.html).toMatch(/<img/i);
		expect(result.warnings.length).toBeGreaterThan(0);
	});

	it("removes javascript: href from anchor tags", () => {
		const result = sanitizePageBody('<a href="javascript:alert(1)">click</a>');

		expect(result.html).not.toMatch(/javascript:/i);
		expect(result.html).toContain("click");
		expect(result.warnings.length).toBeGreaterThan(0);
	});

	it("preserves allow-listed formatting tags and returns empty warnings", () => {
		const input =
			"<h1>Title</h1><h2>Sub</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6><p>Hello <strong>bold</strong> and <em>italic</em></p><ul><li>one</li></ul><ol><li>two</li></ol><blockquote>quote</blockquote><code>code</code><a href=\"https://example.com\">link</a><img src=\"https://example.com/cover.png\" alt=\"cover\">";

		const result = sanitizePageBody(input);

		expect(result.warnings).toEqual([]);
		expect(result.html).toContain("<h1>Title</h1>");
		expect(result.html).toContain("<h2>Sub</h2>");
		expect(result.html).toContain("<h3>H3</h3>");
		expect(result.html).toContain("<h4>H4</h4>");
		expect(result.html).toContain("<h5>H5</h5>");
		expect(result.html).toContain("<h6>H6</h6>");
		expect(result.html).toContain("<p>Hello <strong>bold</strong> and <em>italic</em></p>");
		expect(result.html).toContain("<ul><li>one</li></ul>");
		expect(result.html).toContain("<ol><li>two</li></ol>");
		expect(result.html).toContain("<blockquote>quote</blockquote>");
		expect(result.html).toContain("<code>code</code>");
		expect(result.html).toContain('<a href="https://example.com">link</a>');
		expect(result.html).toMatch(/<img[^>]*src="https:\/\/example.com\/cover.png"/);
	});
});
