import { getSession } from "@auth/lib/server";
import { getPlatformDashboard } from "@startkiter/api/modules/admin/lib/platform-dashboard";
import { isOperator as checkIsOperator } from "@startkiter/permissions";
import { Card } from "@startkiter/ui";
import {
	AlertTriangleIcon,
	BellIcon,
	CheckCircleIcon,
	CheckIcon,
	CreditCardIcon,
	ExternalLinkIcon,
	PlusCircleIcon,
	ReceiptIcon,
	SendIcon,
	TagIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PlatformAdminDashboardPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const isOperator = checkIsOperator(session.user, process.env.ADMIN_EMAIL);
	if (!isOperator) {
		redirect("/");
	}

	const dashboard = await getPlatformDashboard(session.user.id);

	const formatAmount = (amount: number) => `NT$ ${amount.toLocaleString("zh-TW")}`;
	const formatDate = (dateStr: string) => {
		if (!dateStr) return "-";
		const d = new Date(dateStr);
		if (Number.isNaN(d.getTime())) return dateStr;
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${m}/${day}`;
	};

	const displayName = session.user.name || session.user.email || "管理員";

	return (
		<main className="mx-auto max-w-6xl space-y-6 px-0 py-2 sm:p-6" data-testid="platform-dashboard">
			{/* 歡迎列 */}
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="text-2xl font-semibold text-heading">控制台</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						早安，{displayName}。這裡是整個網站的總覽。
					</p>
				</div>
			</div>

			{/* 區塊一：數字概況 */}
			<section data-testid="section-kpis" aria-label="數字概況">
				{dashboard.kpis.status === "unavailable" ? (
					<Card className="p-6 text-center text-sm text-muted-foreground">
						暫時無法載入
					</Card>
				) : (
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						<Card className="p-4">
							<p className="text-sm text-muted-foreground">近 30 天營收</p>
							<p className="mt-2 text-xl sm:text-2xl font-bold text-heading whitespace-nowrap">
								{formatAmount(dashboard.kpis.data.revenueLast30Days)}
							</p>
						</Card>
						<Card className="p-4">
							<p className="text-sm text-muted-foreground">近 30 天訂單</p>
							<p className="mt-2 text-xl sm:text-2xl font-bold text-heading whitespace-nowrap">
								{dashboard.kpis.data.paidOrdersLast30Days}
							</p>
						</Card>
						<Card className="p-4">
							<p className="text-sm text-muted-foreground">學員總數</p>
							<p className="mt-2 text-xl sm:text-2xl font-bold text-heading whitespace-nowrap">
								{dashboard.kpis.data.studentCount}
							</p>
						</Card>
						<Card className="p-4">
							<p className="text-sm text-muted-foreground">上架課程</p>
							<p className="mt-2 text-xl sm:text-2xl font-bold text-heading whitespace-nowrap">
								{dashboard.kpis.data.publishedCourseCount}
							</p>
						</Card>
					</div>
				)}
			</section>

			{/* 區塊二 & 三：待處理 與 網站設定檢查 */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
				{/* 待處理 */}
				<section className="lg:col-span-7" data-testid="section-todos" aria-label="待處理">
					<Card className="h-full p-5">
						<div className="mb-4 flex items-center gap-2">
							<BellIcon className="size-4.5 text-muted-foreground" aria-hidden="true" />
							<h3 className="font-medium text-base text-heading">待處理</h3>
						</div>

						{dashboard.todos.status === "unavailable" ? (
							<div className="py-8 text-center text-sm text-muted-foreground">
								暫時無法載入
							</div>
						) : (
							<div className="divide-y divide-border text-sm">
								<div className="flex items-center justify-between py-3">
									<span className="text-foreground">未讀學員私訊</span>
									<div className="flex items-center gap-3">
										<span
											className={`inline-flex min-w-[26px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
												dashboard.todos.data.unreadMessages > 0
													? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
													: "bg-muted text-muted-foreground"
											}`}
										>
											{dashboard.todos.data.unreadMessages}
										</span>
										<Link
											href="/admin/course/messages"
											className="text-xs text-primary hover:underline"
										>
											去回覆
										</Link>
									</div>
								</div>

								<div className="flex items-center justify-between py-3">
									<span className="text-foreground">未讀課程留言</span>
									<div className="flex items-center gap-3">
										<span
											className={`inline-flex min-w-[26px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
												dashboard.todos.data.unreadComments > 0
													? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
													: "bg-muted text-muted-foreground"
											}`}
										>
											{dashboard.todos.data.unreadComments}
										</span>
										<Link
											href="/admin/course/comments"
											className="text-xs text-primary hover:underline"
										>
											去回覆
										</Link>
									</div>
								</div>

								<div className="flex items-center justify-between py-3">
									<span className="text-foreground">未回覆評價</span>
									<div className="flex items-center gap-3">
										<span
											className={`inline-flex min-w-[26px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
												dashboard.todos.data.unrepliedReviews > 0
													? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
													: "bg-muted text-muted-foreground"
											}`}
										>
											{dashboard.todos.data.unrepliedReviews}
										</span>
										<Link
											href="/admin/course/review"
											className="text-xs text-primary hover:underline"
										>
											查看
										</Link>
									</div>
								</div>

								<div className="flex items-center justify-between py-3">
									<span className="text-foreground">寄送失敗信件（近 7 天）</span>
									<div className="flex items-center gap-3">
										<span
											className={`inline-flex min-w-[26px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
												dashboard.todos.data.failedEmailsLast7Days > 0
													? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
													: "bg-muted text-muted-foreground"
											}`}
										>
											{dashboard.todos.data.failedEmailsLast7Days}
										</span>
										<Link
											href="/admin/email-settings"
											className="text-xs text-primary hover:underline"
										>
											送達紀錄
										</Link>
									</div>
								</div>
							</div>
						)}
					</Card>
				</section>

				{/* 網站設定檢查 */}
				<section className="lg:col-span-5" data-testid="section-checks" aria-label="網站設定檢查">
					<Card className="h-full p-5">
						<div className="mb-4 flex items-center gap-2">
							<CheckCircleIcon className="size-4.5 text-muted-foreground" aria-hidden="true" />
							<h3 className="font-medium text-base text-heading">網站設定檢查</h3>
						</div>

						{dashboard.checks.status === "unavailable" ? (
							<div className="py-8 text-center text-sm text-muted-foreground">
								暫時無法載入
							</div>
						) : (
							<div className="space-y-2 text-sm">
								{dashboard.checks.data.map((check) => {
									const itemTitles: Record<string, string> = {
										email: "寄信服務",
										gateway: "金流",
										einvoice: "電子發票",
										supportEmail: "客服信箱",
										ai: "AI 助手",
									};

									return (
										<Link
											key={check.key}
											href={check.href}
											className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
										>
											<div className="flex items-center gap-2.5">
												{check.ok ? (
													<CheckIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
												) : (
													<AlertTriangleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
												)}
												<span className="text-foreground">
													{itemTitles[check.key] ?? check.key}
												</span>
											</div>
											<span
												className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
													check.ok
														? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
														: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
												}`}
											>
												{check.label}
											</span>
										</Link>
									);
								})}
							</div>
						)}
					</Card>
				</section>
			</div>

			{/* 區塊四 & 五：最近訂單 與 快速操作 */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
				{/* 最近訂單 */}
				<section className="lg:col-span-7" data-testid="section-recent-orders" aria-label="最近訂單">
					<Card className="h-full p-5">
						<div className="mb-4 flex items-center gap-2">
							<ReceiptIcon className="size-4.5 text-muted-foreground" aria-hidden="true" />
							<h3 className="font-medium text-base text-heading">最近訂單</h3>
						</div>

						{dashboard.recentOrders.status === "unavailable" ? (
							<div className="py-8 text-center text-sm text-muted-foreground">
								暫時無法載入
							</div>
						) : dashboard.recentOrders.data.length === 0 ? (
							<div className="py-8 text-center text-sm text-muted-foreground">
								還沒有訂單
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm">
									<thead>
										<tr className="border-b border-border text-xs text-muted-foreground">
											<th className="pb-2 font-medium">時間</th>
											<th className="pb-2 font-medium">學員</th>
											<th className="pb-2 font-medium">課程</th>
											<th className="pb-2 text-right font-medium">金額</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{dashboard.recentOrders.data.map((order) => (
											<tr key={order.id} className="py-2.5">
												<td className="py-2.5 text-xs text-muted-foreground">
													{formatDate(order.paidAt)}
												</td>
												<td className="py-2.5 font-mono text-xs text-foreground">
													{order.maskedEmail}
												</td>
												<td className="py-2.5 text-xs text-foreground">
													{order.courseTitle}
												</td>
												<td className="py-2.5 text-right font-medium text-xs text-foreground">
													{formatAmount(order.amount)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</Card>
				</section>

				{/* 快速操作 */}
				<section className="lg:col-span-5" data-testid="section-quick-actions" aria-label="快速操作">
					<Card className="h-full p-5">
						<div className="mb-4 flex items-center gap-2">
							<ZapIcon className="size-4.5 text-muted-foreground" aria-hidden="true" />
							<h3 className="font-medium text-base text-heading">快速操作</h3>
						</div>

						<div className="flex flex-wrap gap-2.5">
							<Link
								href="/admin/course?action=new-course"
								className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
							>
								<PlusCircleIcon className="size-3.5" />
								新增課程
							</Link>
							<Link
								href="/admin/course?action=new-lesson"
								className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
							>
								<PlusCircleIcon className="size-3.5" />
								新增單元
							</Link>
							<Link
								href="/admin/newsletter/new"
								className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
							>
								<SendIcon className="size-3.5" />
								寫電子報
							</Link>
							<Link
								href="/admin/course/coupons"
								className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
							>
								<TagIcon className="size-3.5" />
								建立優惠券
							</Link>
							<Link
								href="/"
								target="_blank"
								className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
							>
								<ExternalLinkIcon className="size-3.5" />
								查看前台
							</Link>
						</div>
					</Card>
				</section>
			</div>
		</main>
	);
}
