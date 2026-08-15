import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";

import { SiteNav } from "../../components/site-nav";
import { isOperator } from "../../../lib/operator";
import { PayuniSettingsForm } from "./payuni-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/login?next=/admin/settings");
	}

	if (!isOperator(session.user.email, process.env.ADMIN_EMAIL)) {
		redirect("/app");
	}

	return (
		<main>
			<SiteNav signedIn email={session.user.email} />
			<section className="panel stack">
				<div>
					<h1>金流設定</h1>
					<p className="muted">
						PAYUNi 金鑰寫進站內加密儲存後，結帳會優先用這裡的值。欄位留空表示不改舊金鑰。清除後改走環境變數。
					</p>
				</div>
				<PayuniSettingsForm />
			</section>
		</main>
	);
}
