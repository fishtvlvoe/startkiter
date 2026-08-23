// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { LessonMdx } from "./LessonMdx";

const roots = new Set<Root>();

async function render(element: ReactElement) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	roots.add(root);

	await act(async () => {
		root.render(element);
		await new Promise((resolve) => setTimeout(resolve, 0));
	});

	return container;
}

afterEach(() => {
	for (const root of roots) {
		root.unmount();
	}
	roots.clear();
	document.body.replaceChildren();
});

describe("LessonMdx", () => {
	it("從 registry 動態取得既有互動積木元件", async () => {
		const container = await render(
			<LessonMdx
				source={'<InstantQuiz blockId="quiz-01" question="1+1=?" options={["1","2"]} answerIndex={1} explanation="答案是 2" />'}
			/>,
		);

		expect(container.querySelector('[data-component="instant-quiz"]')).not.toBeNull();
		expect(container.textContent).toContain("1+1=?");
	});
});
