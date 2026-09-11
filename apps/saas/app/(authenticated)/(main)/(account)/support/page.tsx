import {
	SUPPORT_MAIL_SUBJECT,
	buildSupportMailto,
	getSupportEmail,
} from "@deployment/support-channel";
import { PageHeader } from "@shared/components/PageHeader";
import { Card } from "@startkiter/ui";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("app.menu");

	return {
		title: t("aiChatbot"),
	};
}

export default async function SupportPage() {
	const supportEmail = getSupportEmail();
	const mailto = buildSupportMailto({
		subject: SUPPORT_MAIL_SUBJECT,
		body: "請描述你遇到的問題：\n\n",
	});

	return (
		<div className="max-w-2xl">
			<PageHeader
				title="客服"
				subtitle="目前客服走 email。寄信給我們，會盡快回覆。"
			/>

			<Card className="space-y-4 p-6">
				<p className="text-sm text-foreground/80">
					這不是 Demo 聊天機器人。請用下面的信箱聯繫，說明你的帳號 email 與遇到的狀況。
				</p>

				{supportEmail ? (
					<div className="space-y-2">
						<p className="text-sm">
							客服信箱：
							<a className="text-primary underline" href={mailto ?? `mailto:${supportEmail}`}>
								{supportEmail}
							</a>
						</p>
						{mailto ? (
							<a
								className="inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
								href={mailto}
							>
								開啟郵件軟體
							</a>
						) : null}
					</div>
				) : (
					<p className="text-sm text-destructive">
						客服信箱尚未設定（缺 NEXT_PUBLIC_SUPPORT_EMAIL）。請改從網站聯絡我們頁面聯繫。
					</p>
				)}
			</Card>
		</div>
	);
}
