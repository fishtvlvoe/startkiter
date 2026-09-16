import { createNewsletterDraft } from "../actions";

export const metadata = { title: "新增電子報" };

export default function NewNewsletterPage() {
	return (
		<div className="mx-auto max-w-2xl space-y-4 p-6">
			<h1 className="text-2xl font-semibold">新增電子報</h1>
			<p className="text-sm text-muted-foreground">建立空白草稿後進入撰寫器。</p>
			<form action={createNewsletterDraft}>
				<button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">建立草稿</button>
			</form>
		</div>
	);
}
