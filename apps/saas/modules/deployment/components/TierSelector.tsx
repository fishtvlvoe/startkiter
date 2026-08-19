"use client";

import { useState } from "react";
import { Card } from "@startkiter/ui/components/card";
import { Button } from "@startkiter/ui/components/button";
import { ArrowLeft, ArrowRight, ExternalLink, Server, Sparkles, Terminal } from "lucide-react";
import { ManagedVpsGuide } from "./ManagedVpsGuide";

type SelectedTier = "managed" | "self-hosted" | null;

interface TierSelectorProps {
	onProvisionSuccess?: () => void;
}

export function TierSelector({ onProvisionSuccess }: TierSelectorProps) {
	const [selectedTier, setSelectedTier] = useState<SelectedTier>(null);

	if (selectedTier === "managed") {
		return (
			<ManagedVpsGuide
				onBack={() => setSelectedTier(null)}
				onSuccess={onProvisionSuccess}
			/>
		);
	}

	if (selectedTier === "self-hosted") {
		return (
			<div className="space-y-6">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setSelectedTier(null)}
					className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
				>
					<ArrowLeft className="size-4" />
					返回選擇部署方式
				</Button>

				<Card className="p-6 space-y-4">
					<div className="flex items-center gap-2">
						<Terminal className="h-5 w-5 text-primary" />
						<h3 className="text-lg font-semibold">自行部署指引</h3>
					</div>
					<p className="text-sm text-muted-foreground leading-relaxed">
						你選擇了自行掌握與部署開站包。你可以依照開站包內附的教學文件，透過 Zeabur 或 Docker 等一鍵部署路徑完成上線。
					</p>
					<div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
						<p className="font-medium text-foreground">快速開始流程：</p>
						<ol className="list-decimal pl-5 space-y-1 text-xs text-muted-foreground leading-relaxed">
							<li>登入你的 GitHub 帳號並取得開站包原始碼倉庫。</li>
							<li>參考專案根目錄的 <code>README.md</code> 與環境變數範例檔。</li>
							<li>點擊 Zeabur 一鍵部署按鈕，或在自有伺服器執行容器部署。</li>
						</ol>
					</div>
					<div className="pt-2 flex flex-wrap gap-3">
						<a
							href="https://github.com/fishtvlvoe/startkiter#readme"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition"
						>
							前往查看部署說明文件 <ExternalLink className="h-3.5 w-3.5" />
						</a>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="grid gap-6 md:grid-cols-2">
			{/* Managed 推薦選項 */}
			<div
				onClick={() => setSelectedTier("managed")}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						setSelectedTier("managed");
					}
				}}
				className="group relative cursor-pointer rounded-xl border-2 border-primary/40 bg-card p-6 shadow-sm ring-1 ring-primary/20 transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			>
				<div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground flex items-center gap-1 shadow-sm">
					<Sparkles className="h-3 w-3" /> 小白推薦
				</div>

				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Server aria-hidden="true" className="size-6 text-primary" />
						<h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
							由 StartKiter 協助代管部署
						</h3>
					</div>
					<p className="text-sm text-muted-foreground leading-relaxed">
						適合不想處理複雜伺服器指令的使用者。你只需依教學準備一台主機，連線與程式上線全由我們自動搞定。
					</p>

					<ul className="text-xs text-muted-foreground space-y-1.5 pt-2">
						<li className="flex items-center gap-1.5">
							<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							包含完整開機引導教學（Vultr / Hetzner）
						</li>
						<li className="flex items-center gap-1.5">
							<span className="h-1.5 w-1.5 rounded-full bg-primary" />
							享有開站包自動維護與更新排查支援
						</li>
					</ul>

					<div className="pt-3 flex items-center text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
						選擇代管部署引導 <ArrowRight className="ml-1 h-3.5 w-3.5" />
					</div>
				</div>
			</div>

			{/* Self-hosted 自行部署選項 */}
			<div
				onClick={() => setSelectedTier("self-hosted")}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						setSelectedTier("self-hosted");
					}
				}}
				className="group cursor-pointer rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-foreground/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
			>
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Terminal aria-hidden="true" className="size-6 text-muted-foreground" />
						<h3 className="text-lg font-semibold group-hover:text-foreground transition-colors">
							我自己來（自行部署）
						</h3>
					</div>
					<p className="text-sm text-muted-foreground leading-relaxed">
						適合有工程背景或喜愛自行管理伺服器的開發者。依據專案文件與一鍵部署按鈕，完全掌握你的程式碼與主機環境。
					</p>

					<ul className="text-xs text-muted-foreground space-y-1.5 pt-2">
						<li className="flex items-center gap-1.5">
							<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
							提供 Zeabur 與 Docker 一鍵部署腳本
						</li>
						<li className="flex items-center gap-1.5">
							<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
							完全掌控主機環境與資料庫配置
						</li>
					</ul>

					<div className="pt-3 flex items-center text-xs font-medium text-muted-foreground group-hover:text-foreground">
						查看自行部署說明 <ArrowRight className="ml-1 h-3.5 w-3.5" />
					</div>
				</div>
			</div>
		</div>
	);
}
