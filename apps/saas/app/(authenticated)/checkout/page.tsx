import { getSession } from "@auth/lib/server";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@startkiter/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { userHasCourseAccess } from "../../../lib/course-access";

import { CheckoutButton } from "./checkout-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CheckoutPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login?next=/checkout");
	}

	const entitled = await userHasCourseAccess(session.user.id);

	return (
		<AuthWrapper>
			<Card>
				<CardHeader>
					<CardTitle>{entitled ? "購買狀態" : "購買開站包"}</CardTitle>
					<CardDescription>
						{entitled
							? "你已擁有開站包，可直接進入課程與領取代碼包。"
							: "課 + 終身代碼包，一次買斷 NT$8,800。付款方式由站方目前啟用的金流處理。"}
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-5">
					{entitled ? (
						<Link
							className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors"
							href="/course"
						>
							進入課程
						</Link>
					) : (
						<>
							<div className="rounded-2xl border border-foreground/10 bg-muted/30 p-4 text-sm text-muted-foreground">
								付完款即可看課；代碼包要再到課程頁綁定 GitHub 後領取。
							</div>
							<CheckoutButton />
						</>
					)}

					<p className="text-sm text-muted-foreground">
						想先逛逛？{" "}
						<Link className="text-primary underline underline-offset-4" href="/course">
							回課程
						</Link>
					</p>
				</CardContent>
			</Card>
		</AuthWrapper>
	);
}
