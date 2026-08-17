import Link from "next/link";

import { Button, Card } from "@startkiter/ui";

import type { LessonDetail, LessonSummary } from "@startkiter/course";

export function CourseWorkspace({
	lessons,
	current,
	entitled,
	player,
}: {
	lessons: LessonSummary[];
	current?: LessonDetail;
	entitled: boolean;
	player: React.ReactNode;
}) {
	const currentIndex = current ? lessons.findIndex((lesson) => lesson.id === current.id) : 0;
	const previous = currentIndex > 0 ? lessons[currentIndex - 1] : null;
	const next = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

	return (
		<div className="course-workspace">
			<aside className="ds-card lesson-rail" data-slot="lesson-list" aria-label="課程單元">
				<h2>單元列表</h2>
				{lessons.map((lesson, index) => (
					<Link
						key={lesson.id}
						className="lesson-item"
						href={`/course/${lesson.id}`}
						aria-current={current?.id === lesson.id ? "true" : undefined}
						data-state={
							!entitled
								? "upcoming"
								: current?.id === lesson.id
									? "current"
									: index < currentIndex
										? "done"
										: "upcoming"
						}
					>
						<span className="lesson-order">{lesson.order}</span>
						<span>{lesson.title}</span>
					</Link>
				))}
				<div style={{ margin: "0.75rem 0.5rem 0.25rem" }}>
					<p className="ds-muted" style={{ margin: "0 0 0.4rem", fontSize: "0.75rem" }}>
						觀看進度
					</p>
					<div className="progress-track" aria-label="已看完 1 / 3">
						<span />
					</div>
					<p className="ds-muted" style={{ margin: "0.4rem 0 0", fontSize: "0.75rem" }}>
						1 / 3 已看完
					</p>
				</div>
			</aside>

			<section>
				{player}
				{current ? (
					<Card className="ds-card" style={{ marginTop: "1rem", padding: "1.25rem 1.5rem" }} data-slot="card">
						<p className="ds-muted" style={{ margin: 0, fontSize: "0.75rem" }}>
							單元 {current.order} / {lessons.length}
						</p>
						<h2 style={{ margin: "0.35rem 0 0", fontSize: "1.15rem", fontWeight: 600 }}>{current.title}</h2>
						<p className="ds-muted" style={{ margin: "0.45rem 0 0", fontSize: "0.9rem" }}>
							{current.description}
						</p>
						{current.isDemoFallback ? (
							<p className="ds-muted" style={{ margin: "0.75rem 0 0", fontSize: "0.8125rem" }}>
								目前播放的是暫時示範畫面。站方接上 Bunny 課片後會自動換成正式內容。退款後此頁會重新鎖住。
							</p>
						) : null}
						<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
							{previous ? (
								<Button asChild variant="secondary" className="ds-btn" data-variant="secondary" data-size="md">
									<Link href={`/course/${previous.id}`}>上一單元</Link>
								</Button>
							) : null}
							{next ? (
								<Button asChild variant="primary" className="ds-btn" data-variant="primary" data-size="md">
									<Link href={`/course/${next.id}`}>下一單元</Link>
								</Button>
							) : null}
						</div>
					</Card>
				) : null}
				<div className="comments-placeholder" data-slot="comments">
					<p>留言區佔位 · 下一輪 change 接上真實討論功能</p>
				</div>
			</section>
		</div>
	);
}
