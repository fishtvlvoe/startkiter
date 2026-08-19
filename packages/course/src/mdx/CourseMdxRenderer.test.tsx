// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { CourseMdxRenderer } from "./CourseMdxRenderer";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

afterEach(() => {
	root?.unmount();
	container?.remove();
	root = null;
	container = null;
});

describe("CourseMdxRenderer", () => {
	it("renders all seven allowlisted blocks as live interactive components", async () => {
		container = document.createElement("div");
		document.body.append(container);
		root = createRoot(container);

		await act(async () => {
			root?.render(
				<CourseMdxRenderer
					content={[
						'<TimelineSync id="timeline" at="00:01" title="時間碼" />',
						"<ConceptCompare id=\"compare\" tabs='[{\"title\":\"前\",\"description\":\"舊\"}]' />",
						"<MicroSandbox id=\"sandbox\" controls='[{\"name\":\"size\",\"type\":\"slider\",\"default\":2}]' />",
						"<WorkflowSorter id=\"sorter\" items='[\"A\",\"B\"]' correctOrder='[\"A\",\"B\"]' />",
						"<InstantQuiz id=\"quiz\" question=\"題目\" options='[\"A\",\"B\"]' answerIndex=\"0\" explanation=\"解析\" />",
						'<TeacherAvatar id="teacher" caption="提示" mood="explaining" />',
						"<DialogueWindow id=\"dialogue\" prompts='[{\"question\":\"問\",\"answer\":\"答\"}]' />",
					].join("\n")}
					currentTime={1}
				/>,
			);
		});

		for (const component of [
			"timeline-sync",
			"concept-compare",
			"micro-sandbox",
			"workflow-sorter",
			"instant-quiz",
			"teacher-avatar",
			"dialogue-window",
		]) {
			expect(container.querySelector(`[data-component="${component}"]`)).not.toBeNull();
		}
	});
});
