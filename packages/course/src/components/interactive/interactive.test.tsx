// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	ConceptCompare,
	DialogueWindow,
	InstantQuiz,
	MicroSandbox,
	TeacherAvatar,
	TimelineSync,
	WorkflowSorter,
} from ".";
import { isTimeActive, parseTimecode, useTimeSync } from "../../hooks/use-time-sync";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
	true;

type RenderHarness = {
	container: HTMLDivElement;
	root: Root;
	render: (element: ReactElement) => Promise<void>;
};

const activeRoots = new Set<Root>();

function setInputValue(input: HTMLInputElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
	setter?.call(input, value);
	input.dispatchEvent(new Event("input", { bubbles: true }));
	input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function createRenderHarness(): Promise<RenderHarness> {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	activeRoots.add(root);
	const render = async (element: ReactElement) => {
		await act(async () => {
			root.render(element);
		});
	};

	return { container, root, render };
}

afterEach(() => {
	for (const root of activeRoots) {
		root.unmount();
	}
	activeRoots.clear();
	document.body.replaceChildren();
	vi.restoreAllMocks();
});

describe("interactive learning blocks", () => {
	it("InstantQuiz evaluates a single choice immediately and emits completion", async () => {
		const onComplete = vi.fn();
		const harness = await createRenderHarness();

		await harness.render(
			<InstantQuiz
				blockId="quiz-01"
				question="哪一個是正確答案？"
				options={["錯誤", "正確"]}
				answerIndex={1}
				explanation="因為第二個選項符合定義。"
				onComplete={onComplete}
			/>,
		);

		const wrongOption = harness.container.querySelector<HTMLButtonElement>(
			'[data-option-index="0"]',
		);
		expect(wrongOption).not.toBeNull();

		await act(async () => {
			wrongOption?.click();
		});

		expect(harness.container.querySelector('[data-result="incorrect"]')).not.toBeNull();
		expect(harness.container.textContent).toContain("再想想");
		expect(harness.container.textContent).toContain("因為第二個選項符合定義。");
		expect(onComplete).toHaveBeenCalledWith({
			correct: false,
			selectedIndices: [0],
		});
	});

	it("InstantQuiz supports multiple answers and evaluates after the complete selection", async () => {
		const onComplete = vi.fn();
		const harness = await createRenderHarness();

		await harness.render(
			<InstantQuiz
				blockId="quiz-02"
				question="選出兩個正確答案"
				options={["A", "B", "C"]}
				answerIndex={[0, 2]}
				multiple
				explanation="A 與 C 都符合條件。"
				onComplete={onComplete}
			/>,
		);

		const optionA = harness.container.querySelector<HTMLInputElement>(
			'input[data-option-index="0"]',
		);
		const optionC = harness.container.querySelector<HTMLInputElement>(
			'input[data-option-index="2"]',
		);

		await act(async () => {
			if (optionA && optionC) {
				optionA.click();
				optionC.click();
			}
		});

		expect(harness.container.querySelector('[data-result="correct"]')).not.toBeNull();
		expect(onComplete).toHaveBeenCalledWith({
			correct: true,
			selectedIndices: [0, 2],
		});
	});

	it("ConceptCompare switches the active comparison tab", async () => {
		const harness = await createRenderHarness();

		await harness.render(
			<ConceptCompare
				tabs={[
					{ title: "之前", description: "舊方法", code: "old()" },
					{ title: "之後", description: "新方法", code: "new()" },
				]}
			/>,
		);

		expect(harness.container.textContent).toContain("舊方法");
		expect(harness.container.textContent).not.toContain("新方法");

		const nextTab = harness.container.querySelector<HTMLButtonElement>(
			'[role="tab"][data-tab-index="1"]',
		);
		await act(async () => {
			nextTab?.click();
		});

		expect(harness.container.textContent).toContain("新方法");
		expect(harness.container.textContent).not.toContain("舊方法");
	});

	it("TimelineSync highlights a block at its timecode and scrolls it into view", async () => {
		const scrollIntoView = vi.fn();
		HTMLElement.prototype.scrollIntoView = scrollIntoView;
		const harness = await createRenderHarness();

		await harness.render(
			<TimelineSync at="01:30" end="02:00" currentTime={90} autoScroll title="重點">
				<p>影片重點內容</p>
			</TimelineSync>,
		);

		const block = harness.container.querySelector("[data-component=\"timeline-sync\"]");
		expect(block?.getAttribute("data-active")).toBe("true");
		expect(block?.getAttribute("aria-current")).toBe("step");
		expect(scrollIntoView).toHaveBeenCalledWith({
			behavior: "smooth",
			block: "center",
		});

		await harness.render(
			<TimelineSync at="01:30" end="02:00" currentTime={130} title="重點">
				<p>影片重點內容</p>
			</TimelineSync>,
		);
		expect(
			harness.container.querySelector("[data-component=\"timeline-sync\"]")?.getAttribute(
				"data-active",
			),
		).toBe("false");
	});

	it("WorkflowSorter supports keyboard ordering and announces a correct sequence", async () => {
		const onComplete = vi.fn();
		const harness = await createRenderHarness();

		await harness.render(
			<WorkflowSorter
				blockId="sorter-01"
				items={[
					{ id: "build", label: "建置" },
					{ id: "plan", label: "規劃" },
					{ id: "launch", label: "上線" },
				]}
				correctOrder={["plan", "build", "launch"]}
				explanation="先規劃，再建置，最後上線。"
				onComplete={onComplete}
			/>,
		);

		const movePlanUp = harness.container.querySelector<HTMLButtonElement>(
			'[data-item-id="plan"][data-action="move-up"]',
		);
		await act(async () => {
			movePlanUp?.click();
		});

		expect(harness.container.querySelector('[data-result="correct"]')).not.toBeNull();
		expect(harness.container.textContent).toContain("先規劃，再建置，最後上線。");
		expect(onComplete).toHaveBeenCalledWith({
			correct: true,
			order: ["plan", "build", "launch"],
		});
	});

	it("MicroSandbox updates control values and renders the preview", async () => {
		const harness = await createRenderHarness();

		await harness.render(
			<MicroSandbox
				template="button"
				controls={[
					{ name: "size", type: "slider", default: 12, min: 8, max: 24 },
					{ name: "label", type: "text", default: "開始" },
				]}
				renderPreview={(values) => (
					<strong>
						{values.label} / {values.size}
					</strong>
				)}
			/>,
		);

		expect(harness.container.textContent).toContain("開始 / 12");
		const size = harness.container.querySelector<HTMLInputElement>('input[name="size"]');
		expect(size).not.toBeNull();

		await act(async () => {
			if (size) {
				setInputValue(size, "20");
			}
		});

		expect(harness.container.textContent).toContain("開始 / 20");
	});

	it("TeacherAvatar exposes mood, highlighted caption, and speech action", async () => {
		const onSpeak = vi.fn();
		const harness = await createRenderHarness();

		await harness.render(
			<TeacherAvatar mood="explaining" caption="請看這條重點" at="00:30" onSpeak={onSpeak} />,
		);

		const avatar = harness.container.querySelector('[data-component="teacher-avatar"]');
		expect(avatar?.getAttribute("data-mood")).toBe("explaining");
		expect(harness.container.querySelector("mark")?.textContent).toBe("請看這條重點");

		const speak = harness.container.querySelector<HTMLButtonElement>(
			'[data-action="speak"]',
		);
		await act(async () => {
			speak?.click();
		});
		expect(onSpeak).toHaveBeenCalledOnce();
	});

	it("DialogueWindow reveals the selected response and optional avatar", async () => {
		const harness = await createRenderHarness();

		await harness.render(
			<DialogueWindow
				avatar
				prompts={[
					{ question: "為什麼要先規劃？", response: "先規劃能降低返工。" },
					{ question: "何時上線？", response: "完成驗證後再上線。" },
				]}
			/>,
		);

		expect(harness.container.querySelector('[data-component="teacher-avatar"]')).not.toBeNull();
		expect(harness.container.textContent).not.toContain("先規劃能降低返工。");

		const prompt = harness.container.querySelector<HTMLButtonElement>(
			'[data-prompt-index="0"]',
		);
		await act(async () => {
			prompt?.click();
		});

		expect(harness.container.textContent).toContain("先規劃能降低返工。");
	});

	it("useTimeSync parses timecodes and reports active ranges", () => {
		expect(parseTimecode("01:30")).toBe(90);
		expect(parseTimecode("01:02:03")).toBe(3723);
		expect(parseTimecode(12.5)).toBe(12.5);
		expect(isTimeActive(90, "01:30", "02:00")).toBe(true);
		expect(isTimeActive(120, "01:30", "02:00")).toBe(false);

		function SyncProbe() {
			const sync = useTimeSync({ currentTime: 90, at: "01:30", end: "02:00" });
			return <output data-active={String(sync.isActive)}>{sync.startSeconds}</output>;
		}

		return createRenderHarness().then(async (harness) => {
			await harness.render(<SyncProbe />);
			expect(harness.container.querySelector("output")?.textContent).toBe("90");
			expect(harness.container.querySelector("output")?.getAttribute("data-active")).toBe(
				"true",
			);
		});
	});
});
