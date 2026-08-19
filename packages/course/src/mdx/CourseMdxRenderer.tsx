"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import {
	ConceptCompare,
	DialogueWindow,
	InstantQuiz,
	MicroSandbox,
	TeacherAvatar,
	TimelineSync,
	WorkflowSorter,
} from "../components/interactive";
import { parseCourseMdx, type CourseMdxBlock } from "./course-mdx";

export type CourseMdxRendererProps = {
	content: string | null | undefined;
	currentTime: number;
	onBlockComplete?: (blockId: string) => Promise<void> | void;
	onSeek?: (seconds: number) => void;
};

function MarkdownContent({ markdown }: { markdown: string }) {
	if (!markdown) {
		return null;
	}

	return (
		<div className="space-y-3" data-course-markdown>
			{markdown.split(/\n{2,}/).map((paragraph, index) => {
				const text = paragraph.trim();
				if (!text) {
					return null;
				}
				if (text.startsWith("# ")) {
					return <h2 key={index}>{text.slice(2)}</h2>;
				}
				if (text.startsWith("## ")) {
					return <h3 key={index}>{text.slice(3)}</h3>;
				}
				return <p key={index}>{text}</p>;
			})}
		</div>
	);
}

export function CourseMdxRenderer({
	content,
	currentTime,
	onBlockComplete,
	onSeek,
}: CourseMdxRendererProps) {
	const parsed = useMemo(() => parseCourseMdx(content), [content]);
	const completedBlockIdsRef = useRef(new Set<string>());

	useEffect(() => {
		completedBlockIdsRef.current.clear();
	}, [content]);

	const completeBlock = useCallback(
		(blockId: string) => {
			if (completedBlockIdsRef.current.has(blockId)) {
				return;
			}
			completedBlockIdsRef.current.add(blockId);

			void Promise.resolve(onBlockComplete?.(blockId))
				.catch(() => {
					completedBlockIdsRef.current.delete(blockId);
				});
		},
		[onBlockComplete],
	);

	if (!parsed.ok) {
		return (
			<p className="rounded-md border border-destructive/40 p-3 text-sm" role="alert">
				講義內容未通過安全驗證，無法顯示。
			</p>
		);
	}

	const renderBlock = (block: CourseMdxBlock) => {
		switch (block.type) {
			case "TimelineSync":
				return (
					<TimelineSync
						at={block.props.at}
						autoScroll
						currentTime={currentTime}
						end={block.props.end}
						key={block.id}
						onSeek={(seconds) => {
							onSeek?.(seconds);
							completeBlock(block.id);
						}}
						title={block.props.title}
					/>
				);
			case "ConceptCompare":
				return (
					<ConceptCompare
						key={block.id}
						onTabChange={() => completeBlock(block.id)}
						tabs={block.props.tabs}
					/>
				);
			case "MicroSandbox":
				return (
					<MicroSandbox
						controls={block.props.controls}
						key={block.id}
						onValuesChange={() => completeBlock(block.id)}
						template={block.props.template}
					/>
				);
			case "WorkflowSorter":
				return (
					<WorkflowSorter
						correctOrder={block.props.correctOrder}
						explanation={block.props.explanation}
						items={block.props.items}
						key={block.id}
						onComplete={(result) => {
							if (result.correct) {
								completeBlock(block.id);
							}
						}}
					/>
				);
			case "InstantQuiz":
				return (
					<InstantQuiz
						answerIndex={block.props.answerIndex}
						explanation={block.props.explanation}
						key={block.id}
						multiple={block.props.multiple}
						onComplete={(result) => {
							if (result.correct) {
								completeBlock(block.id);
							}
						}}
						options={block.props.options}
						question={block.props.question}
					/>
				);
			case "TeacherAvatar":
				return (
					<TeacherAvatar
						at={block.props.at}
						caption={block.props.caption}
						key={block.id}
						mood={block.props.mood}
						onSpeak={() => completeBlock(block.id)}
					/>
				);
			case "DialogueWindow":
				return (
					<DialogueWindow
						avatar={block.props.avatar}
						key={block.id}
						onPromptSelect={() => completeBlock(block.id)}
						prompts={block.props.prompts}
					/>
				);
		}
	};

	return (
		<div className="space-y-5" data-course-mdx>
			<MarkdownContent markdown={parsed.markdown} />
			{parsed.blocks.map(renderBlock)}
		</div>
	);
}
