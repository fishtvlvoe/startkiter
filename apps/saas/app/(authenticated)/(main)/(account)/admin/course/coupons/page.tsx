import { getSession } from "@auth/lib/server";
import { manageableCourseWhereForUser } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { db } from "@startkiter/database";
import { checkPermission, isOperator } from "@startkiter/permissions";
import { redirect } from "next/navigation";
import { ExportSpreadsheetButton } from "@admin/component/ExportSpreadsheetButton";

export default async function CourseCouponsPage() {
	const session = await getSession();
	if (!session) redirect("/login");

	const canManageCoupons = isOperator(session.user, process.env.ADMIN_EMAIL);
	const canExportCoupons = checkPermission({ user: session.user }, "admin.access");
	const courseWhere = await manageableCourseWhereForUser(session.user.id);
	const courses = await db.course.findMany({ where: courseWhere, select: { slug: true } });
	const orders = await db.order.findMany({
		where: { sku: { in: courses.map((course) => course.slug) }, couponId: { not: null } },
		select: { couponId: true },
		distinct: ["couponId"],
	});
	const couponIds = orders.flatMap((order) => order.couponId ? [order.couponId] : []);
	const coupons = couponIds.length === 0 ? [] : await db.coupon.findMany({ where: { id: { in: couponIds } }, orderBy: { createdAt: "desc" } });

	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6" data-testid="course-coupons-page">
			<header>
				<p className="text-sm text-caption">課程管理</p>
				<h1 className="text-2xl font-semibold text-heading">課程優惠券</h1>
				<p className="mt-1 text-sm text-body">只顯示目前可管理課程已使用的優惠券，避免跨課程看到其他講師資料。</p>
			</header>

			{canManageCoupons && (
				<section className="rounded-lg border border-divider p-4 bg-surface space-y-4">
					<h2 className="text-lg font-semibold text-heading">建立優惠券</h2>
					<form method="POST" action="/api/coupons" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label className="block text-sm font-medium text-body" htmlFor="code">優惠碼</label>
							<input id="code" name="code" type="text" required placeholder="例如 SAVE100" className="mt-1 block w-full rounded border border-divider p-2 text-sm" />
						</div>
						<div>
							<label className="block text-sm font-medium text-body" htmlFor="discountType">折扣類型</label>
							<select id="discountType" name="discountType" className="mt-1 block w-full rounded border border-divider p-2 text-sm">
								<option value="amount">固定金額 (NT$)</option>
								<option value="percent">百分比 (%)</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-body" htmlFor="amountOff">折抵金額</label>
							<input id="amountOff" name="amountOff" type="number" min="1" placeholder="例如 100" className="mt-1 block w-full rounded border border-divider p-2 text-sm" />
						</div>
						<div>
							<label className="block text-sm font-medium text-body" htmlFor="percentOff">折扣百分比</label>
							<input id="percentOff" name="percentOff" type="number" min="1" max="100" placeholder="例如 20" className="mt-1 block w-full rounded border border-divider p-2 text-sm" />
						</div>
						<div className="sm:col-span-2">
							<button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">建立優惠券</button>
						</div>
					</form>
				</section>
			)}

			{canExportCoupons && (
				<div className="flex justify-end">
					<ExportSpreadsheetButton endpoint="/api/export/coupons" />
				</div>
			)}

			<section className="overflow-x-auto rounded-lg border border-divider">
				<table className="w-full text-left text-sm">
					<thead className="bg-surface-hover">
						<tr>
							<th className="p-3">代碼</th>
							<th className="p-3">折扣</th>
							<th className="p-3">已使用</th>
							<th className="p-3">狀態</th>
						</tr>
					</thead>
					<tbody>
						{coupons.length === 0 ? (
							<tr>
								<td className="p-4 text-caption" colSpan={4}>目前沒有可查看的優惠券。</td>
							</tr>
						) : (
							coupons.map((coupon) => (
								<tr key={coupon.id} className="border-t border-divider">
									<td className="p-3 font-medium text-heading">{coupon.code}</td>
									<td className="p-3 text-body">
										{coupon.discountType.toLowerCase() === "percent"
											? `${coupon.percentOff ?? 0}%`
											: `NT$ ${coupon.amountOff ?? 0}`}
									</td>
									<td className="p-3 text-body">{coupon.timesRedeemed}</td>
									<td className="p-3 text-body">{coupon.active ? "啟用" : "停用"}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</section>
		</main>
	);
}
