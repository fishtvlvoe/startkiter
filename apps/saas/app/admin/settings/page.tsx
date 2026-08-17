import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { getMessagesForLocale } from "@startkiter/i18n";

import { shouldShowOperatorSettingsLink } from "../../../lib/operator";
import { getRequestLocale } from "../../../lib/request-locale";
import { AppShell } from "../../components/app-shell";
import { PayuniSettingsForm } from "./payuni-settings-form";

export const dynamic = "force-dynamic";

type ShellMessages = {
	brand: string;
};

export default async function AdminSettingsPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/login?next=/admin/settings");
	}

	const showOperatorSettings = shouldShowOperatorSettingsLink(
		true,
		session.user.email,
		process.env.ADMIN_EMAIL,
	);
	if (!showOperatorSettings) {
		redirect("/app");
	}

	const locale = await getRequestLocale();
	const messages = await getMessagesForLocale<ShellMessages>(locale, "saas");

	return (
		<main className="app-main-root">
			<AppShell
				brand={messages.brand}
				email={session.user.email}
				name={session.user.name}
				locale={locale}
				current="settings"
				showOperatorSettings={showOperatorSettings}
				heading={
					<>
						<p className="ds-muted" style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
							帳號設定
						</p>
						<h1 style={{ margin: "0.2rem 0 0", fontSize: "1.5rem", fontWeight: 600 }}>金流設定</h1>
						<p className="ds-muted" style={{ margin: "0.25rem 0 0" }}>
							管理 PAYUNi 結帳所使用的站內金鑰。
						</p>
					</>
				}
			>
				<section className="panel stack">
					<div>
						<h2>PAYUNi 金流</h2>
						<p className="muted">
							PAYUNi 金鑰寫進站內加密儲存後，結帳會優先用這裡的值。欄位留空表示不改舊金鑰。清除後改走環境變數。
						</p>
					</div>
					<PayuniSettingsForm />
				</section>
			</AppShell>
		</main>
	);
}
