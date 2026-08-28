import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "./button";
import { Logo } from "./logo";
import { cn } from "../lib";

describe("UI primitives", () => {
	it("merges Tailwind classes with later utilities taking precedence", () => {
		expect(cn("px-2 text-sm", "px-4", false && "hidden")).toBe("text-sm px-4");
	});

	it("renders the official logo icon and label", () => {
		const html = renderToStaticMarkup(<Logo />);

		expect(html).toContain('viewBox="0 0 32 32"');
		expect(html).toContain(">StartKiter</span>");
	});

	it("renders a primary button with its content", () => {
		const html = renderToStaticMarkup(<Button variant="primary">Start building</Button>);

		expect(html).toContain("bg-primary");
		expect(html).toContain("Start building");
	});
});
