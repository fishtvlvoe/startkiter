import { getSession } from "@auth/lib/server";
import { readGeminiApiKey, writeGeminiApiKey } from "@startkiter/api/modules/course/lib/gemini-settings";
import { hasAnyCourseInstructorAssignment } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { checkPermission } from "@startkiter/permissions";
import { Card } from "@startkiter/ui";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireInstructorSettingsAccess() {
	const session = await getSession();
	if (!session) redirect("/login");
	const isOperator = checkPermission({ user: session.user }, "admin.access");
	const isInstructor = !isOperator && (await hasAnyCourseInstructorAssignment(session.user.id));
	if (!isOperator && !isInstructor) redirect("/");
	return session;
}

async function saveGeminiSettings(formData: FormData) {
	"use server";

	const session = await requireInstructorSettingsAccess();
	const result = await writeGeminiApiKey(session.user.id, String(formData.get("apiKey") ?? ""));
	if (!result.ok) {
		redirect(`/admin/settings/gemini?error=${encodeURIComponent(result.error ?? "settings_unavailable")}`);
	}
	revalidatePath("/admin/settings/gemini");
	redirect("/admin/settings/gemini?saved=1");
}

export async function generateMetadata() {
	return { title: "Gemini API Key 設定" };
}

export default async function GeminiSettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ saved?: string; error?: string }>;
}) {
	const session = await requireInstructorSettingsAccess();
	const configured = Boolean(await readGeminiApiKey(session.user.id));
	const params = await searchParams;

	return (
		<div className="space-y-6">
			<Card className="p-6">
				<h2 className="text-xl font-semibold">Gemini API Key</h2>
				<p className="mt-2 text-sm text-muted-foreground">API Key 只會加密儲存，不會在頁面顯示明文。</p>
				<p className="mt-2 text-sm">目前狀態：{configured ? "已設定" : "未設定"}</p>
				{params.saved === "1" && <p className="mt-4 text-sm text-green-600">設定已儲存。</p>}
				{params.error && <p className="mt-4 text-sm text-red-600">儲存失敗：{params.error}</p>}
			</Card>

			<Card className="p-6">
				<form action={saveGeminiSettings} className="space-y-5">
					<div className="grid gap-2">
						<label htmlFor="apiKey">Gemini API Key</label>
						<input id="apiKey" name="apiKey" type="password" required placeholder="輸入新的 API Key" autoComplete="new-password" className="rounded-md border p-2" />
					</div>
					<button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">儲存設定</button>
				</form>
			</Card>
		</div>
	);
}
