import { PageHeader } from "@shared/components/PageHeader";
import { AiChat } from "@ai/components/AiChat";

export default function AiChatPage() {
	return (
		<div className="max-w-3xl">
			<PageHeader title="AI 助手" subtitle="即時串流對話，不會保存聊天紀錄。" />
			<AiChat />
		</div>
	);
}
