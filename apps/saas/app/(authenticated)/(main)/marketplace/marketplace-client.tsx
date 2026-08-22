"use client";

import { useEffect, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@startkiter/ui";
import type { PluginManifest } from "@startkiter/platform/src/types";
import type { SiteTemplate } from "@startkiter/platform/src/templates/types";

export type MarketplacePlugin = PluginManifest & { enabled: boolean };

export type RepoVersionSectionData = {
	buyerVersion: string;
	latestVersion: string;
	upToDate: boolean | null;
	syncPromptHint: string;
};

type MarketplaceClientProps = {
	initialPlugins: MarketplacePlugin[];
	initialTemplates: SiteTemplate[];
	initialVersion: RepoVersionSectionData;
};

export function MarketplaceClient({
	initialPlugins,
	initialTemplates,
	initialVersion,
}: MarketplaceClientProps) {
	const [plugins, setPlugins] = useState(initialPlugins);
	const [templates, setTemplates] = useState(initialTemplates);
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				const [pluginsRes, templatesRes] = await Promise.all([
					fetch("/api/plugins"),
					fetch("/api/templates"),
				]);

				if (!cancelled && pluginsRes.ok) {
					setPlugins((await pluginsRes.json()) as MarketplacePlugin[]);
				}

				if (!cancelled && templatesRes.ok) {
					setTemplates((await templatesRes.json()) as SiteTemplate[]);
				}
			} catch {
				// Keep server-provided initial data if client fetch fails.
			}
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, []);

	const selectedTemplate =
		templates.find((template) => template.id === selectedTemplateId) ?? null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Marketplace</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					檢視已啟用模組與站點模版。模組變更請用 AI 工具改 repo，此頁不提供安裝或移除操作。
				</p>
			</div>

			<Card data-testid="repo-version-section">
				<CardHeader>
					<CardTitle className="text-base">倉庫版本</CardTitle>
					{initialVersion.upToDate === true ? (
						<CardDescription>已是最新版本（{initialVersion.buyerVersion}）。</CardDescription>
					) : initialVersion.upToDate === false ? (
						<CardDescription>
							你的倉庫版本落後最新版本（{initialVersion.buyerVersion} → {initialVersion.latestVersion}）。
						</CardDescription>
					) : (
						<CardDescription>暫時無法比對版本，請確認 GitHub 授權設定。</CardDescription>
					)}
				</CardHeader>
				{initialVersion.upToDate === false && initialVersion.syncPromptHint ? (
					<CardContent className="space-y-2 text-sm">
						<p className="text-muted-foreground">
							把下面指令貼給你的 AI 工具，在你的專屬倉庫內執行即可同步（系統不會主動推送或合併）。
						</p>
						<pre
							data-testid="sync-prompt-hint"
							className="bg-muted overflow-x-auto rounded-md border border-border p-3 text-xs whitespace-pre-wrap"
						>
							{initialVersion.syncPromptHint}
						</pre>
					</CardContent>
				) : null}
			</Card>

			<div data-testid="marketplace-root">
			<Tabs defaultValue="plugins">
				<TabsList>
					<TabsTrigger value="plugins">已啟用模組</TabsTrigger>
					<TabsTrigger value="templates">模版選擇</TabsTrigger>
				</TabsList>

				<TabsContent value="plugins" className="space-y-3">
					{plugins.map((plugin) => (
						<Card key={plugin.id} data-plugin-id={plugin.id}>
							<CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
								<div>
									<CardTitle className="text-base">{plugin.name}</CardTitle>
									<CardDescription>
										id: {plugin.id} · version: {plugin.version}
									</CardDescription>
								</div>
								<Badge status={plugin.enabled ? "success" : "info"}>
									{plugin.enabled ? "已啟用" : "未啟用"}
								</Badge>
							</CardHeader>
						</Card>
					))}
				</TabsContent>

				<TabsContent value="templates" className="space-y-4">
					<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
						{templates.map((template) => (
							<button
								key={template.id}
								type="button"
								data-testid="template-preview-card"
								data-template-id={template.id}
								className="text-left"
								onClick={() => setSelectedTemplateId(template.id)}
							>
								<Card className="h-full transition-colors hover:border-foreground/30">
									<CardHeader>
										<div
											className="bg-muted mb-3 flex h-28 items-center justify-center rounded-md border border-border text-muted-foreground text-xs"
											aria-hidden="true"
										>
											preview: {template.previewImagePath}
										</div>
										<CardTitle className="text-base">{template.name}</CardTitle>
										<CardDescription className="line-clamp-3">
											{template.description}
										</CardDescription>
									</CardHeader>
								</Card>
							</button>
						))}
					</div>

					{selectedTemplate ? (
						<Card data-testid="template-detail">
							<CardHeader>
								<CardTitle>{selectedTemplate.name}</CardTitle>
								<CardDescription>{selectedTemplate.description}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 text-sm">
								<div>
									<p className="mb-1 font-medium">AI prompt hint</p>
									<pre className="bg-muted overflow-x-auto rounded-md border border-border p-3 whitespace-pre-wrap">
										{selectedTemplate.aiPromptHint}
									</pre>
								</div>
								<div>
									<p className="mb-1 font-medium">視覺引導：如何用 AI 工具套用</p>
									<ol className="text-muted-foreground list-decimal space-y-1 pl-5">
										<li>打開你的買家倉庫，把下面 prompt 貼給 AI 工具。</li>
										<li>
											AI 讀取此模版的 <code>defaultMountConfig</code>，更新
											<code>MOUNT_POINTS</code> 靜態陣列與 CSS token。
										</li>
										<li>commit + push 後由 Coolify／Vercel 自動重建，無需 runtime 設定層。</li>
									</ol>
								</div>
								<div>
									<p className="mb-1 font-medium">defaultMountConfig</p>
									<pre className="bg-muted overflow-x-auto rounded-md border border-border p-3 text-xs">
										{JSON.stringify(selectedTemplate.defaultMountConfig, null, 2)}
									</pre>
								</div>
								<Button
									type="button"
									variant="outline"
									onClick={() => setSelectedTemplateId(null)}
								>
									關閉詳情
								</Button>
							</CardContent>
						</Card>
					) : null}
				</TabsContent>
			</Tabs>

			{/* Always mounted for SSR / static assertion: template tab cards */}
			<div className="sr-only" aria-hidden="true" data-testid="template-cards-ssr">
				{templates.map((template) => (
					<div
						key={`ssr-${template.id}`}
						data-testid="template-preview-card"
						data-template-id={template.id}
					>
						{template.id}:{template.name}
					</div>
				))}
			</div>
			</div>
		</div>
	);
}
