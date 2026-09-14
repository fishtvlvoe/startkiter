import { getSession } from "@auth/lib/server";
import {
	GEMINI_TEXT_MODEL_OPTIONS,
	OPENAI_TEXT_MODEL_OPTIONS,
} from "@startkiter/ai";
import {
	readAiProviderSettings,
	writeAiProviderSettings,
	type AiProvider,
} from "@startkiter/api/modules/ai/lib/provider-settings";
import { checkPermission } from "@startkiter/permissions";
import { Card } from "@startkiter/ui";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireGlobalAdmin } from "../../../../../../../lib/admin-access";

async function saveAiProviderSettings(formData: FormData) {
	"use server";

	const session = await getSession();
	if (!session || !checkPermission({ user: session.user }, "admin.access")) redirect("/login");

	const providerRaw = String(formData.get("provider") ?? "");
	const provider: AiProvider = providerRaw === "gemini" ? "gemini" : "openai";
	const model = String(formData.get("model") ?? "").trim();
	const geminiApiKey = String(formData.get("geminiApiKey") ?? "");
	const allowedModels =
		provider === "gemini" ? GEMINI_TEXT_MODEL_OPTIONS : OPENAI_TEXT_MODEL_OPTIONS;

	if (!allowedModels.includes(model as never)) {
		redirect(`/admin/settings/ai-provider?error=${encodeURIComponent("invalid_model_for_provider")}`);
	}

	const result = await writeAiProviderSettings({
		provider,
		model,
		geminiApiKey: geminiApiKey.trim() ? geminiApiKey : undefined,
	});

	if (!result.ok) {
		redirect(`/admin/settings/ai-provider?error=${encodeURIComponent(result.error)}`);
	}

	revalidatePath("/admin/settings/ai-provider");
	redirect("/admin/settings/ai-provider?saved=1");
}

export async function generateMetadata() {
	return { title: "AI 助手模型設定" };
}

export default async function AiProviderSettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ saved?: string; error?: string }>;
}) {
	await requireGlobalAdmin();
	const settings = await readAiProviderSettings();
	const params = await searchParams;
	const modelOptions =
		settings.provider === "gemini" ? GEMINI_TEXT_MODEL_OPTIONS : OPENAI_TEXT_MODEL_OPTIONS;
	const selectedModel = modelOptions.includes(settings.model as never)
		? settings.model
		: modelOptions[0];

	return (
		<div className="space-y-6">
			<Card className="p-6">
				<h2 className="text-xl font-semibold">AI 助手模型</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					全站共用一組設定。同一時間只啟用一個供應商；Gemini API Key 加密存放，頁面只顯示是否已設定。
				</p>
				<p className="mt-2 text-sm">
					目前供應商：{settings.provider === "gemini" ? "Google Gemini" : "OpenAI"}；模型：
					{settings.model}；Gemini Key：{settings.hasGeminiKey ? "已設定" : "未設定"}
				</p>
				{params.saved === "1" && <p className="mt-4 text-sm text-green-600">設定已儲存。</p>}
				{params.error && <p className="mt-4 text-sm text-red-600">儲存失敗：{params.error}</p>}
			</Card>

			<Card className="p-6">
				<form action={saveAiProviderSettings} className="space-y-5">
					<div className="grid gap-2">
						<label htmlFor="provider">供應商</label>
						<select
							id="provider"
							name="provider"
							defaultValue={settings.provider}
							className="rounded-md border p-2"
						>
							<option value="openai">OpenAI</option>
							<option value="gemini">Google Gemini</option>
						</select>
					</div>

					<div className="grid gap-2">
						<label htmlFor="model">文字模型</label>
						<select id="model" name="model" defaultValue={selectedModel} className="rounded-md border p-2">
							{OPENAI_TEXT_MODEL_OPTIONS.map((modelId) => (
								<option key={`openai-${modelId}`} value={modelId} data-provider="openai">
									OpenAI · {modelId}
								</option>
							))}
							{GEMINI_TEXT_MODEL_OPTIONS.map((modelId) => (
								<option key={`gemini-${modelId}`} value={modelId} data-provider="gemini">
									Gemini · {modelId}
								</option>
							))}
						</select>
						<p className="text-xs text-muted-foreground">
							請選與上方供應商相符的模型；存檔後以該組合生效。
						</p>
					</div>

					<div className="grid gap-2">
						<label htmlFor="geminiApiKey">Gemini API Key</label>
						<input
							id="geminiApiKey"
							name="geminiApiKey"
							type="password"
							placeholder={settings.hasGeminiKey ? "留白表示維持原金鑰" : "選 Gemini 時請填入 API Key"}
							autoComplete="new-password"
							className="rounded-md border p-2"
						/>
						<p className="text-xs text-muted-foreground">
							狀態：{settings.hasGeminiKey ? "已設定" : "未設定"}（不會顯示明文金鑰）
						</p>
					</div>

					<button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
						儲存設定
					</button>
				</form>
			</Card>
		</div>
	);
}
