"use client";

import { evaluate } from "@mdx-js/mdx";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import * as runtime from "react/jsx-runtime";

import {
	ConceptCompare,
	DialogueWindow,
	InstantQuiz,
	type InstantQuizProps,
	MicroSandbox,
	TeacherAvatar,
	TimelineSync,
	type TimelineSyncProps,
	WorkflowSorter,
	type WorkflowSorterProps,
} from "../components/interactive";
import { inspectMdxSource } from "./inspect-mdx-source";

type MdxContent = ComponentType<{ components?: Record<string, ComponentType<never>> }>;

export type LessonMdxProps = {
	source: string;
	onInteractiveComplete?: (blockId: string) => void;
	currentTime?: number;
};

export function LessonMdx({ source, onInteractiveComplete, currentTime }: LessonMdxProps) {
	const [Content, setContent] = useState<MdxContent | null>(null);
	const [error, setError] = useState<string | null>(null);

	const components = useMemo(
		() =>
			({
				TimelineSync: (props: TimelineSyncProps) => (
					<TimelineSync currentTime={currentTime} {...props} />
				),
				ConceptCompare,
				MicroSandbox,
				WorkflowSorter: (props: WorkflowSorterProps) => (
					<WorkflowSorter
						{...props}
						onComplete={() => {
							if (props.blockId) {
								onInteractiveComplete?.(props.blockId);
							}
						}}
					/>
				),
				InstantQuiz: (props: InstantQuizProps) => (
					<InstantQuiz
						{...props}
						onComplete={(result) => {
							if (result.correct && props.blockId) {
								onInteractiveComplete?.(props.blockId);
							}
						}}
					/>
				),
				TeacherAvatar,
				DialogueWindow,
			}) as Record<string, ComponentType<never>>,
		[currentTime, onInteractiveComplete],
	);

	useEffect(() => {
		let cancelled = false;

		setContent(null);
		setError(null);

		const inspection = inspectMdxSource(source);

		if (!inspection.ok) {
			setError(inspection.error);
			return;
		}

		if (!source.trim()) {
			return;
		}

		void evaluate(source, {
			...runtime,
			development: false,
		})
			.then((mod) => {
				if (!cancelled) {
					setContent(() => mod.default as MdxContent);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setError("講義內容無法渲染。");
				}
			});

		return () => {
			cancelled = true;
		};
	}, [source]);

	if (error) {
		return (
			<p className="rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200" role="alert">
				{error}
			</p>
		);
	}

	if (!source.trim()) {
		return null;
	}

	if (!Content) {
		return <p className="text-sm text-neutral-500">講義載入中…</p>;
	}

	return <Content components={components} />;
}
