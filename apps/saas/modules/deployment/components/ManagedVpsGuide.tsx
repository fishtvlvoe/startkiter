"use client";

import { useState } from "react";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@startkiter/ui/components/button";
import { Input } from "@startkiter/ui/components/input";
import { Label } from "@startkiter/ui/components/label";
import { Card } from "@startkiter/ui/components/card";
import { Check, Copy, Server, Loader2, ArrowLeft } from "lucide-react";
import { DEFAULT_STARTKITER_SSH_PUBLIC_KEY } from "../constants";

interface ManagedVpsGuideProps {
	onBack?: () => void;
	onSuccess?: () => void;
}

export function ManagedVpsGuide({ onBack, onSuccess }: ManagedVpsGuideProps) {
	const [copied, setCopied] = useState(false);
	const [ip, setIp] = useState("");
	const [publicKey] = useState(DEFAULT_STARTKITER_SSH_PUBLIC_KEY);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleCopyKey = async () => {
		try {
			await navigator.clipboard.writeText(publicKey);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback
			setCopied(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			await orpcClient.deployment.provision({
				tier: "managed",
				ip: ip.trim(),
				publicKey: publicKey.trim(),
			});
			setIsSubmitted(true);
			if (onSuccess) {
				onSuccess();
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "提交失敗，請檢查主機 IP 格式是否正確。";
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	if (isSubmitted) {
		return (
			<Card className="p-6 space-y-4 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
					<Check className="h-6 w-6" />
				</div>
				<h3 className="text-xl font-semibold">主機資訊已成功提交！</h3>
				<p className="text-sm text-muted-foreground max-w-md mx-auto">
					我們已經收到你的主機 IP，系統正在協助你連接與初始化開站包。完成後你的網站狀態將會在控制台更新。
				</p>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{onBack && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onBack}
					className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
				>
					<ArrowLeft className="h-4 w-4" /> 返回選擇部署方式
				</Button>
			)}

			<Card className="p-6 space-y-6">
				<div>
					<h3 className="text-lg font-semibold flex items-center gap-2">
						<Server className="h-5 w-5 text-primary" />
						協助代管部署：主機設定教學
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						只需 3 個步驟，將你租用的雲端主機交由 StartKiter 進行自動化配置與維護。
					</p>
				</div>

				{/* 步驟 1 */}
				<div className="rounded-lg border bg-muted/40 p-4 space-y-2">
					<div className="font-medium text-sm text-foreground flex items-center gap-2">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
							1
						</span>
						在 Vultr 或 Hetzner 建立一台雲端主機
					</div>
					<p className="text-xs text-muted-foreground pl-7 leading-relaxed">
						建議規格：最低 <strong>2 vCPU / 4GB RAM</strong>（系統選擇 <strong>Ubuntu 22.04 LTS</strong>）。機房可選擇新加坡（Vultr）或德國/芬蘭（Hetzner）。
					</p>
				</div>

				{/* 步驟 2 */}
				<div className="rounded-lg border bg-muted/40 p-4 space-y-3">
					<div className="font-medium text-sm text-foreground flex items-center gap-2">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
							2
						</span>
						建立主機時填入 StartKiter 連線金鑰
					</div>
					<p className="text-xs text-muted-foreground pl-7">
						在主機建立頁面的「SSH Keys / 金鑰」設定區，貼上以下 StartKiter 專屬公鑰：
					</p>
					<div className="pl-7 flex items-center gap-2">
						<code className="flex-1 rounded bg-background px-3 py-2 text-xs font-mono border break-all select-all">
							{publicKey}
						</code>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleCopyKey}
							className="gap-1.5 shrink-0"
						>
							{copied ? (
								<>
									<Check className="h-3.5 w-3.5 text-green-600" /> 已複製
								</>
							) : (
								<>
									<Copy className="h-3.5 w-3.5" /> 複製公鑰
								</>
							)}
						</Button>
					</div>
				</div>

				{/* 步驟 3 */}
				<div className="rounded-lg border bg-muted/40 p-4 space-y-4">
					<div className="font-medium text-sm text-foreground flex items-center gap-2">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
							3
						</span>
						輸入主機 IP 位址並送出
					</div>
					<p className="text-xs text-muted-foreground pl-7">
						主機建立完成後，複製供應商面板顯示的 IPv4 位址並貼在下方：
					</p>

					<form onSubmit={handleSubmit} className="pl-7 space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="server-ip" className="text-xs font-medium">
								主機 IP 位址
							</Label>
							<Input
								id="server-ip"
								type="text"
								placeholder="例如: 203.0.113.10"
								value={ip}
								onChange={(e) => setIp(e.target.value)}
								required
								className="max-w-md font-mono text-sm"
							/>
						</div>

						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
								{error}
							</div>
						)}

						<Button type="submit" disabled={isLoading || !ip.trim()} className="gap-2">
							{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
							確認提交並開始配置
						</Button>
					</form>
				</div>
			</Card>
		</div>
	);
}
