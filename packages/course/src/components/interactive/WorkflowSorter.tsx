"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";

export type WorkflowItem = string | { id: string; label: ReactNode };

export type WorkflowSortResult = {
	correct: boolean;
	order: string[];
};

export type WorkflowSorterProps = {
	items: readonly WorkflowItem[];
	correctOrder: readonly string[];
	explanation?: ReactNode;
	onComplete?: (result: WorkflowSortResult) => void;
	onOrderChange?: (order: string[]) => void;
	className?: string;
};

type WorkflowItemRecord = {
	id: string;
	label: ReactNode;
};

function normalizeWorkflowItems(items: readonly WorkflowItem[]): WorkflowItemRecord[] {
	return items.map((item) =>
		typeof item === "string" ? { id: item, label: item } : { id: item.id, label: item.label },
	);
}

export function moveWorkflowItem<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
	if (
		fromIndex < 0 ||
		fromIndex >= items.length ||
		toIndex < 0 ||
		toIndex >= items.length ||
		fromIndex === toIndex
	) {
		return [...items];
	}

	const nextItems = [...items];
	const [movedItem] = nextItems.splice(fromIndex, 1);
	if (movedItem !== undefined) {
		nextItems.splice(toIndex, 0, movedItem);
	}
	return nextItems;
}

export function isWorkflowOrderCorrect(
	order: readonly string[],
	correctOrder: readonly string[],
): boolean {
	return order.length === correctOrder.length && order.every((id, index) => id === correctOrder[index]);
}

export function WorkflowSorter({
	items,
	correctOrder,
	explanation,
	onComplete,
	onOrderChange,
	className,
}: WorkflowSorterProps) {
	const [order, setOrder] = useState<WorkflowItemRecord[]>(() => normalizeWorkflowItems(items));
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const completedRef = useRef(false);
	const orderIds = useMemo(() => order.map((item) => item.id), [order]);
	const isCorrect = isWorkflowOrderCorrect(orderIds, correctOrder);

	useEffect(() => {
		if (isCorrect && !completedRef.current) {
			completedRef.current = true;
			onComplete?.({ correct: true, order: orderIds });
		}
		if (!isCorrect) {
			completedRef.current = false;
		}
	}, [isCorrect, onComplete, orderIds]);

	const updateOrder = (nextOrder: WorkflowItemRecord[]) => {
		setOrder(nextOrder);
		onOrderChange?.(nextOrder.map((item) => item.id));
	};

	const reorder = (sourceId: string, targetId: string) => {
		const fromIndex = order.findIndex((item) => item.id === sourceId);
		const toIndex = order.findIndex((item) => item.id === targetId);
		if (fromIndex === -1 || toIndex === -1) {
			return;
		}
		updateOrder(moveWorkflowItem(order, fromIndex, toIndex));
	};

	const handleDrop = (event: DragEvent<HTMLLIElement>, targetId: string) => {
		event.preventDefault();
		const sourceId = event.dataTransfer?.getData("text/plain") || draggedId;
		if (sourceId) {
			reorder(sourceId, targetId);
		}
		setDraggedId(null);
	};

	return (
		<section
			className={"interactive-block interactive-workflow " + (className ?? "")}
			data-component="workflow-sorter"
			data-complete={String(isCorrect)}
		>
			<ol>
				{order.map((item, index) => (
					<li
						data-item-id={item.id}
						data-position={index}
						draggable
						key={item.id}
						onDragEnd={() => setDraggedId(null)}
						onDragOver={(event) => event.preventDefault()}
						onDragStart={(event) => {
							setDraggedId(item.id);
							event.dataTransfer?.setData("text/plain", item.id);
						}}
						onDrop={(event) => handleDrop(event, item.id)}
					>
						<span>{item.label}</span>
						<span>
							<button
								aria-label={
									"將" +
									(typeof item.label === "string" ? item.label : item.id) +
									"上移"
								}
								data-action="move-up"
								data-item-id={item.id}
								disabled={index === 0}
								onClick={() => updateOrder(moveWorkflowItem(order, index, index - 1))}
								type="button"
							>
								上移
							</button>
							<button
								aria-label={
									"將" +
									(typeof item.label === "string" ? item.label : item.id) +
									"下移"
								}
								data-action="move-down"
								data-item-id={item.id}
								disabled={index === order.length - 1}
								onClick={() => updateOrder(moveWorkflowItem(order, index, index + 1))}
								type="button"
							>
								下移
							</button>
						</span>
					</li>
				))}
			</ol>
			<div aria-live="polite" data-result={isCorrect ? "correct" : "pending"} role="status">
				{isCorrect ? (
					<>
						<strong>順序正確</strong>
						{explanation ? <div>{explanation}</div> : null}
					</>
				) : (
					<span>調整步驟順序</span>
				)}
			</div>
		</section>
	);
}
