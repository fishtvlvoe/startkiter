"use client";

import Link from "next/link";

export type Attempt = {
	userId: string;
	userName: string;
	userEmail: string;
	attemptCount: number;
	latestAttemptId: string;
	score: number;
	passed: boolean;
	submittedAt: string;
	timeTakenSeconds: number | null;
};

export function buildQuizResultsCsv(attempts: Attempt[]): string {
	const header = ["學員姓名", "學員 Email", "分數", "作答時間", "及格與否"];
	const rows = attempts.map((attempt) => [attempt.userName, attempt.userEmail, String(attempt.score), attempt.submittedAt, attempt.passed ? "是" : "否"]);
	return `\ufeff${[header, ...rows].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n")}`;
}

export function QuizResultsTable({ attempts, courseId }: { attempts: Attempt[]; courseId: string }) {
	function exportCsv() {
		const blob = new Blob([buildQuizResultsCsv(attempts)], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "quiz-results.csv";
		link.click();
		URL.revokeObjectURL(url);
	}

	return (
		<section className="space-y-4" data-testid="quiz-results-table">
			<div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-heading">最新成績（{attempts.length} 位學員）</h2><button type="button" onClick={exportCsv} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">匯出 CSV</button></div>
			{attempts.length === 0 ? <p className="text-sm text-caption">目前沒有作答紀錄。</p> : <div className="overflow-x-auto rounded-lg border border-divider"><table className="w-full text-left text-sm"><thead className="bg-surface-hover"><tr><th className="p-3">學員</th><th className="p-3">分數</th><th className="p-3">作答時間</th><th className="p-3">狀態</th><th className="p-3">檢視</th></tr></thead><tbody>{attempts.map((attempt) => <tr key={attempt.userId} className="border-t border-divider"><td className="p-3"><p className="font-medium text-heading">{attempt.userName}</p><p className="text-xs text-caption">{attempt.userEmail}</p></td><td className="p-3 text-body">{attempt.score}</td><td className="p-3 text-body">{new Date(attempt.submittedAt).toLocaleString("zh-TW")}</td><td className="p-3">{attempt.passed ? <span className="text-green-600">及格</span> : <span className="text-red-600">未及格</span>}<span className="ml-2 text-xs text-caption">{attempt.attemptCount} 次</span></td><td className="p-3"><Link className="text-primary underline" href={`/admin/course/quiz/${courseId}/attempt/${attempt.latestAttemptId}`}>逐題檢視</Link></td></tr>)}</tbody></table></div>}
		</section>
	);
}
