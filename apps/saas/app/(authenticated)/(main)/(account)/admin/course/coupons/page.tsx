import { getSession } from "@auth/lib/server";
import { manageableCourseWhereForUser } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { db } from "@startkiter/database";
import { redirect } from "next/navigation";

export default async function CourseCouponsPage() {
	const session = await getSession();
	if (!session) redirect("/login");
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
			<header><p className="text-sm text-caption">課程管理</p><h1 className="text-2xl font-semibold text-heading">課程優惠券</h1><p className="mt-1 text-sm text-body">只顯示目前可管理課程已使用的優惠券，避免跨課程看到其他講師資料。</p></header>
			<section className="overflow-x-auto rounded-lg border border-divider"><table className="w-full text-left text-sm"><thead className="bg-surface-hover"><tr><th className="p-3">代碼</th><th className="p-3">折扣</th><th className="p-3">已使用</th><th className="p-3">狀態</th></tr></thead><tbody>{coupons.length === 0 ? <tr><td className="p-4 text-caption" colSpan={4}>目前沒有可查看的優惠券。</td></tr> : coupons.map((coupon) => <tr key={coupon.id} className="border-t border-divider"><td className="p-3 font-medium text-heading">{coupon.code}</td><td className="p-3 text-body">{coupon.discountType === "PERCENT" ? `${coupon.percentOff ?? 0}%` : `NT$ ${coupon.amountOff ?? 0}`}</td><td className="p-3 text-body">{coupon.timesRedeemed}</td><td className="p-3 text-body">{coupon.active ? "啟用" : "停用"}</td></tr>)}</tbody></table></section>
		</main>
	);
}
