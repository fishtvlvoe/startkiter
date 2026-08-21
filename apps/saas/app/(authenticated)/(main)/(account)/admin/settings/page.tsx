import { Card } from "@startkiter/ui";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	return {
		title: "後台設定",
	};
}

export default async function AdminSettingsPage() {
	return (
		<div className="space-y-6">
			<Card className="p-6">
				<h2 className="text-xl font-semibold mb-2">後台設定</h2>
				<p className="text-muted-foreground text-sm">
					管理系統與站內全域設定。
				</p>
			</Card>
		</div>
	);
}
