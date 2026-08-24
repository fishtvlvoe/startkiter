"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { Button, Card } from "@startkiter/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InviteRedeemPanel({ token }: { token: string }) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [redeemed, setRedeemed] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	async function redeem() {
		setSubmitting(true);
		setError(null);
		try {
			await orpcClient.course.redeemCourseInvite({ token });
			setRedeemed(true);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "兌換邀請失敗，請確認連結仍有效。");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Card className="mx-auto mt-12 max-w-lg space-y-5 p-6" data-testid="course-invite-redeem">
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">StartKiter 課程邀請</p>
				<h1 className="text-2xl font-bold">兌換課程存取權</h1>
				<p className="text-sm text-muted-foreground">登入帳號會取得這門課的播放權限。</p>
			</div>

			{redeemed ? (
				<div className="space-y-3" data-testid="course-invite-redeemed">
					<p className="text-green-600">邀請已兌換，可以開始上課。</p>
					<Button type="button" onClick={() => router.push("/course")}>前往課程</Button>
				</div>
			) : (
				<div className="space-y-3">
					{error && <p className="text-sm text-destructive" data-testid="course-invite-error">{error}</p>}
					<Button type="button" loading={submitting} onClick={redeem} data-testid="redeem-course-invite">兌換邀請</Button>
				</div>
			)}
		</Card>
	);
}
