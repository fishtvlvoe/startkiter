import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { getMessagesForLocale } from "@startkiter/i18n";

import { shouldShowOperatorSettingsLink } from "../../lib/operator";
import { getRequestLocale } from "../../lib/request-locale";
import { AppShell } from "../components/app-shell";
import { AgentChatClient } from "./agent-chat-client";

type ShellMessages = {
	brand: string;
};

export default async function AgentPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/login");
	}

	const locale = await getRequestLocale();
	const messages = await getMessagesForLocale<ShellMessages>(locale, "saas");
	const showOperatorSettings = shouldShowOperatorSettingsLink(
		true,
		session.user.email,
		process.env.ADMIN_EMAIL,
	);

	return (
		<main className="app-main-root">
			<AppShell
				brand={messages.brand}
				email={session.user.email}
				name={session.user.name}
				locale={locale}
				current="agent"
				showOperatorSettings={showOperatorSettings}
				heading={
					<>
						<p className="ds-muted" style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
							客服
						</p>
						<h1 style={{ margin: "0.2rem 0 0", fontSize: "1.5rem", fontWeight: 600 }}>站內助手</h1>
						<p className="ds-muted" style={{ margin: "0.25rem 0 0" }}>
							只查自己的訂單與課程進度。
						</p>
					</>
				}
			>
				<AgentChatClient />
			</AppShell>
		</main>
	);
}
