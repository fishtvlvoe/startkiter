"use client";

import { Button } from "@startkiter/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@startkiter/ui/components/dialog";
import { Headphones, MessageSquare, Globe } from "lucide-react";
import React, { useState } from "react";

export interface SupportDeployment {
	id: string;
	name?: string | null;
	publicUrl?: string | null;
	tier?: string | null;
}

export interface OpenSupportChatOptions {
	deployments?: SupportDeployment[] | null;
	selectedDeploymentId?: string | null;
	onRequireSelection?: () => void;
}

export interface OpenSupportChatResult {
	needsSelection: boolean;
	selectedId: string | null;
}

export function openSupportChat(options: OpenSupportChatOptions = {}): OpenSupportChatResult {
	const { deployments, selectedDeploymentId, onRequireSelection } = options;

	// 無部署記錄時：直接開啟客服框，不設定 buyerDeploymentId
	if (!deployments || deployments.length === 0) {
		if (typeof window !== "undefined" && window.$chatwoot) {
			window.$chatwoot.toggle("open");
		}
		return { needsSelection: false, selectedId: null };
	}

	// 剛好一個部署：自動帶入
	if (deployments.length === 1 && deployments[0]) {
		const depId = deployments[0].id;
		if (typeof window !== "undefined" && window.$chatwoot) {
			window.$chatwoot.setCustomAttributes({
				buyerDeploymentId: depId,
			});
			window.$chatwoot.toggle("open");
		}
		return { needsSelection: false, selectedId: depId };
	}

	// 多個部署且尚未選擇：觸發要求選擇流程
	if (!selectedDeploymentId) {
		onRequireSelection?.();
		return { needsSelection: true, selectedId: null };
	}

	// 多個部署且已選擇：設定 custom attributes 並開啟
	if (typeof window !== "undefined" && window.$chatwoot) {
		window.$chatwoot.setCustomAttributes({
			buyerDeploymentId: selectedDeploymentId,
		});
		window.$chatwoot.toggle("open");
	}

	return { needsSelection: false, selectedId: selectedDeploymentId };
}

export interface SupportWidgetProps {
	deployments?: SupportDeployment[];
}

export function SupportWidget({ deployments = [] }: SupportWidgetProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const handleOpenChat = () => {
		openSupportChat({
			deployments,
			selectedDeploymentId: selectedId,
			onRequireSelection: () => setIsOpen(true),
		});
	};

	const handleConfirmSelection = () => {
		if (!selectedId) {
			return;
		}

		openSupportChat({
			deployments,
			selectedDeploymentId: selectedId,
		});
		setIsOpen(false);
	};

	return (
		<>
			{/* 浮動客服按鈕 */}
			<div className="fixed bottom-6 right-6 z-40">
				<Button
					type="button"
					size="icon"
					className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
					aria-label="開啟線上客服"
					onClick={handleOpenChat}
				>
					<MessageSquare className="h-6 w-6" />
				</Button>
			</div>

			{/* 多部署選擇對話框 */}
			{deployments.length > 1 && (
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Headphones className="h-5 w-5 text-primary" />
								選擇要回報問題的網站部署
							</DialogTitle>
							<DialogDescription>
								你名下有多個網站部署，請選擇本次客服諮詢主要針對的網站，以利工程團隊迅速定位問題。
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3 py-3">
							{deployments.map((dep) => {
								const isSelected = selectedId === dep.id;
								return (
									<button
										key={dep.id}
										type="button"
										onClick={() => setSelectedId(dep.id)}
										className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
											isSelected
												? "border-primary bg-primary/5 ring-1 ring-primary"
												: "border-border hover:bg-muted/50"
										}`}
									>
										<div className="flex items-center gap-2.5">
											<Globe className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">
													{dep.name || dep.publicUrl || `部署 (${dep.id})`}
												</p>
												{dep.publicUrl && (
													<p className="text-muted-foreground text-xs">{dep.publicUrl}</p>
												)}
											</div>
										</div>
										<div
											className={`h-4 w-4 rounded-full border flex items-center justify-center ${
												isSelected
													? "border-primary bg-primary text-primary-foreground"
													: "border-muted-foreground"
											}`}
										>
											{isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
										</div>
									</button>
								);
							})}
						</div>

						<DialogFooter className="flex gap-2 sm:justify-end">
							<Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
								取消
							</Button>
							<Button
								type="button"
								disabled={!selectedId}
								onClick={handleConfirmSelection}
							>
								確認並開啟客服
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
