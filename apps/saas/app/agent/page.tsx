import { getSession } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { redirect } from "next/navigation";

import { AgentChatClient } from "./agent-chat-client";

export default async function AgentPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	return (
		<>
			<PageHeader
				title="站內助手"
				subtitle="只會查你自己的訂單與課程進度，不能改資料。客服請用 email。"
				className="mx-auto max-w-3xl"
			/>
			<AgentChatClient />
		</>
	);
}
