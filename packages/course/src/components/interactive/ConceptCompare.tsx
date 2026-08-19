"use client";

import { useId, useState, type ReactNode } from "react";

export type ConceptCompareTab = {
	title: ReactNode;
	description?: ReactNode;
	code?: string;
	visual?: ReactNode;
};

export type ConceptCompareProps = {
	tabs: readonly ConceptCompareTab[];
	defaultIndex?: number;
	onTabChange?: (index: number) => void;
	className?: string;
};

export function ConceptCompare({
	tabs,
	defaultIndex = 0,
	onTabChange,
	className,
}: ConceptCompareProps) {
	const baseId = useId();
	const [selectedIndex, setSelectedIndex] = useState(() =>
		Math.min(Math.max(defaultIndex, 0), Math.max(tabs.length - 1, 0)),
	);
	const activeIndex = Math.min(Math.max(selectedIndex, 0), Math.max(tabs.length - 1, 0));
	const activeTab = tabs[activeIndex];

	if (!activeTab) {
		return (
			<section className={"interactive-block interactive-compare " + (className ?? "")}>
				<p data-component="concept-compare">尚無對照內容</p>
			</section>
		);
	}

	const selectTab = (index: number) => {
		setSelectedIndex(index);
		onTabChange?.(index);
	};

	return (
		<section
			className={"interactive-block interactive-compare " + (className ?? "")}
			data-active-index={activeIndex}
			data-component="concept-compare"
		>
			<div aria-label="概念對照分頁" role="tablist">
				{tabs.map((tab, index) => (
					<button
						aria-controls={baseId + "-panel"}
						aria-selected={activeIndex === index}
						data-tab-index={index}
						key={index}
						onClick={() => selectTab(index)}
						role="tab"
						type="button"
					>
						{tab.title}
					</button>
				))}
			</div>
			<div aria-label="概念對照內容" id={baseId + "-panel"} role="tabpanel">
				{activeTab.visual ? <div data-slot="visual">{activeTab.visual}</div> : null}
				{activeTab.description ? (
					<div data-slot="description">{activeTab.description}</div>
				) : null}
				{activeTab.code ? (
					<pre data-slot="code">
						<code>{activeTab.code}</code>
					</pre>
				) : null}
			</div>
		</section>
	);
}
