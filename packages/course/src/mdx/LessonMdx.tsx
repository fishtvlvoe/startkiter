"use client";

import { evaluate } from "@mdx-js/mdx";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import * as runtime from "react/jsx-runtime";

import type { InstantQuizProps, TimelineSyncProps, WorkflowSorterProps } from "../components/interactive";
import { BLOCK_REGISTRY } from "./block-registry";
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
		() => {
			const registryComponents = Object.fromEntries(
				BLOCK_REGISTRY.map(({ name, component }) => [name, component]),
			) as Record<string, ComponentType<any>>;
			const TimelineSyncComponent = registryComponents.TimelineSync as ComponentType<TimelineSyncProps>;
			const WorkflowSorterComponent = registryComponents.WorkflowSorter as ComponentType<WorkflowSorterProps>;
			const InstantQuizComponent = registryComponents.InstantQuiz as ComponentType<InstantQuizProps>;

			return {
				...registryComponents,
				TimelineSync: (props: TimelineSyncProps) => (
					<TimelineSyncComponent currentTime={currentTime} {...props} />
				),
				WorkflowSorter: (props: WorkflowSorterProps) => (
					<WorkflowSorterComponent
						{...props}
						onComplete={() => {
							if (props.blockId) {
								onInteractiveComplete?.(props.blockId);
							}
						}}
					/>
				),
				InstantQuiz: (props: InstantQuizProps) => (
					<InstantQuizComponent
						{...props}
						onComplete={(result) => {
							if (result.correct && props.blockId) {
								onInteractiveComplete?.(props.blockId);
							}
						}}
					/>
				),
			} as Record<string, ComponentType<never>>;
		},
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
