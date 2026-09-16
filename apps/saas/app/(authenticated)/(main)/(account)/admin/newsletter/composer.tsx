"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { NewsletterContentBlock, NewsletterContentJson } from "./content-types";
import type { RenderCampaignResult } from "@startkiter/newsletter/lib/render";

export type NewsletterCampaignDraft = {
	id: string;
	name: string;
	type: "GENERAL" | "PROMO";
	subject: string;
	preheader?: string | null;
	contentJson: NewsletterContentJson;
	senderName?: string | null;
	replyTo?: string | null;
};

export type ComposerActionResult = { ok: true } | { ok: false; error: string };

export type NewsletterAutosaveInput = {
	campaignId: string;
	subject: string;
	preheader: string;
	contentJson: NewsletterContentJson;
};

export type NewsletterTestSendInput = {
	campaignId: string;
	recipient: string;
};

export type NewsletterSendInput = { campaignId: string };

export type NewsletterAudiencePrepareInput = {
	campaignId: string;
	preset: "all" | "manual";
	manualEmails?: string[];
};

export type NewsletterAudiencePrepareResult =
	| { ok: true; recipientEstimate: number }
	| { ok: false; error: string };

type NewsletterComposerProps = {
	campaign: NewsletterCampaignDraft;
	recipientEstimate: number;
	onAutosave: (input: NewsletterAutosaveInput) => Promise<ComposerActionResult>;
	onSendTest: (input: NewsletterTestSendInput) => Promise<ComposerActionResult>;
	onSend: (input: NewsletterSendInput) => Promise<ComposerActionResult>;
	onPrepareAudience?: (
		input: NewsletterAudiencePrepareInput,
	) => Promise<NewsletterAudiencePrepareResult>;
	initialPreview?: RenderCampaignResult;
	onRenderPreview?: (contentJson: NewsletterContentJson) => Promise<RenderCampaignResult>;
};

const EMPTY_PREVIEW: RenderCampaignResult = {
	html: "<!DOCTYPE html><html><body><p>（空白電子報）</p></body></html>",
	text: "（空白電子報）",
	sizeBytes: 0,
	isOversized: false,
	warnings: [],
};

function initialBlocks(contentJson: NewsletterContentJson): NewsletterContentBlock[] {
	return Array.isArray(contentJson.blocks) && contentJson.blocks.length > 0
		? contentJson.blocks
		: [{ type: "paragraph", content: "" }];
}

function newBlock(type: NewsletterContentBlock["type"]): NewsletterContentBlock {
	switch (type) {
		case "heading":
			return { type, props: { level: 1 }, content: "標題" };
		case "paragraph":
			return { type, content: "段落內容" };
		case "image":
			return { type, props: { src: "", alt: "" } };
		case "button":
			return { type, props: { text: "立即查看", url: "https://" } };
		case "divider":
			return { type, props: { color: "#E2E8F0" } };
		case "videoCard":
			return { type, props: { title: "影片標題", url: "https://", thumbnailUrl: "" } };
		case "video":
			return { type, props: { title: "影片標題", url: "https://" } };
		case "coupon":
			return {
				type,
				props: {
					couponId: "manual-coupon",
					code: "SAVE20",
					codeReadOnly: true,
					expiresAt: new Date("2026-12-31T15:59:59.000Z").toISOString(),
				},
			};
		case "course":
			return {
				type,
				props: {
					courseId: "manual-course",
					title: "開站包",
					priceLabel: "NT$8,800",
					priceReadOnly: true,
					url: "/courses/startkiter",
					urlReadOnly: true,
					imageUrl: "https://cdn.example.com/cover.png",
				},
			};
		case "countdown":
			return {
				type,
				props: {
					text: "優惠倒數至 2026/10/01 23:59",
					expiresAt: new Date("2026-10-01T15:59:59.000Z").toISOString(),
				},
			};
		default:
			return { type: "paragraph", content: "" };
	}
}

function blockLabel(type: NewsletterContentBlock["type"]): string {
	return {
		heading: "標題",
		paragraph: "段落",
		image: "圖片",
		button: "按鈕",
		divider: "分隔線",
		video: "影片卡",
		videoCard: "影片卡",
		coupon: "優惠券",
		course: "課程卡",
		countdown: "倒數",
	}[type];
}

function getBlockProps(block: NewsletterContentBlock): Record<string, unknown> {
	return "props" in block && block.props ? block.props as Record<string, unknown> : {};
}

export default function NewsletterComposer({
	campaign,
	recipientEstimate: initialRecipientEstimate,
	onAutosave,
	onSendTest,
	onSend,
	onPrepareAudience,
	initialPreview,
	onRenderPreview,
}: NewsletterComposerProps) {
	const [subject, setSubject] = useState(campaign.subject);
	const [preheader, setPreheader] = useState(campaign.preheader ?? "");
	const [blocks, setBlocks] = useState(() => initialBlocks(campaign.contentJson));
	const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
	const [testRecipient, setTestRecipient] = useState("");
	const [testState, setTestState] = useState<"idle" | "sending">("idle");
	const [testError, setTestError] = useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
	const [sendError, setSendError] = useState<string | null>(null);
	const [recipientEstimate, setRecipientEstimate] = useState(initialRecipientEstimate);
	const [audiencePreset, setAudiencePreset] = useState<"all" | "manual">("manual");
	const [manualEmails, setManualEmails] = useState("");
	const [audienceState, setAudienceState] = useState<"idle" | "saving" | "saved" | "error">("idle");
	const [audienceError, setAudienceError] = useState<string | null>(null);
	const firstRender = useRef(true);
	const sendInFlight = useRef(false);
	const contentJson = useMemo<NewsletterContentJson>(() => ({ blocks }), [blocks]);
	const [rendered, setRendered] = useState<RenderCampaignResult>(initialPreview ?? EMPTY_PREVIEW);

	useEffect(() => {
		if (!onRenderPreview) return;
		let active = true;
		const timeout = window.setTimeout(async () => {
			try {
				const nextPreview = await onRenderPreview(contentJson);
				if (active) setRendered(nextPreview);
			} catch {
				if (active) setRendered((current) => ({ ...current, warnings: ["即時預覽更新失敗"] }));
			}
		}, 250);
		return () => {
			active = false;
			window.clearTimeout(timeout);
		};
	}, [contentJson, onRenderPreview]);

	useEffect(() => {
		if (firstRender.current) {
			firstRender.current = false;
			return;
		}
		const timeout = window.setTimeout(async () => {
			setAutosaveState("saving");
			try {
				const result = await onAutosave({ campaignId: campaign.id, subject, preheader, contentJson });
				setAutosaveState(result.ok ? "saved" : "error");
			} catch {
				setAutosaveState("error");
			}
		}, 750);
		return () => window.clearTimeout(timeout);
	}, [campaign.id, contentJson, onAutosave, preheader, subject]);

	function updateBlock(index: number, update: Partial<NewsletterContentBlock>) {
		setBlocks((current) => current.map((block, blockIndex) => blockIndex === index ? { ...block, ...update } as NewsletterContentBlock : block));
	}

	function updateProp(index: number, key: string, value: string) {
		setBlocks((current) => current.map((block, blockIndex) => blockIndex === index
			? { ...block, props: { ...getBlockProps(block), [key]: value } } as NewsletterContentBlock
			: block));
	}

	async function sendTest() {
		const recipient = testRecipient.trim();
		if (!recipient) {
			setTestError("請輸入測試收件信箱");
			return;
		}
		setTestError(null);
		setTestState("sending");
		try {
			const result = await onSendTest({ campaignId: campaign.id, recipient });
			setTestState("idle");
			if (!result.ok) setTestError(result.error);
			else setTestError("測試信已送出");
		} catch (error) {
			setTestState("idle");
			setTestError(error instanceof Error ? error.message : "測試信寄送失敗");
		}
	}

	async function sendCampaign() {
		if (sendInFlight.current || sendState !== "idle" || recipientEstimate <= 0 || rendered.isOversized) return;
		sendInFlight.current = true;
		setSendState("sending");
		setSendError(null);
		try {
			const result = await onSend({ campaignId: campaign.id });
			if (result.ok) setSendState("sent");
			else {
				sendInFlight.current = false;
				setSendState("idle");
				setSendError(result.error);
			}
		} catch (error) {
			sendInFlight.current = false;
			setSendState("idle");
			setSendError(error instanceof Error ? error.message : "發送失敗");
		}
	}

	async function prepareAudience() {
		if (!onPrepareAudience) return;
		setAudienceState("saving");
		setAudienceError(null);
		try {
			const result = await onPrepareAudience({
				campaignId: campaign.id,
				preset: audiencePreset,
				manualEmails: audiencePreset === "manual"
					? manualEmails.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean)
					: undefined,
			});
			if (!result.ok) {
				setAudienceState("error");
				setAudienceError(result.error);
				return;
			}
			setRecipientEstimate(result.recipientEstimate);
			setAudienceState("saved");
		} catch (error) {
			setAudienceState("error");
			setAudienceError(error instanceof Error ? error.message : "分眾套用失敗");
		}
	}

	return (
		<div className="space-y-6" data-testid="newsletter-composer">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">撰寫電子報</h1>
					<p className="mt-1 text-sm text-muted-foreground">{campaign.name} · {campaign.type === "PROMO" ? "促銷" : "一般"}</p>
				</div>
				<span className="text-sm text-muted-foreground" aria-live="polite">
					{autosaveState === "saving" ? "儲存中…" : autosaveState === "saved" ? "草稿已自動儲存" : autosaveState === "error" ? "自動儲存失敗" : "草稿"}
				</span>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
				<section className="space-y-5 rounded-xl border bg-card p-5" aria-label="電子報內容編輯器">
					<label className="grid gap-2 text-sm font-medium" htmlFor="newsletter-subject">
						主旨
						<input id="newsletter-subject" value={subject} onChange={(event) => setSubject(event.target.value)} className="h-10 rounded-md border px-3 font-normal" />
					</label>
					<label className="grid gap-2 text-sm font-medium" htmlFor="newsletter-preheader">
						預覽文字
						<input id="newsletter-preheader" value={preheader} onChange={(event) => setPreheader(event.target.value)} className="h-10 rounded-md border px-3 font-normal" />
					</label>

					<div className="flex flex-wrap gap-2" aria-label="新增內容區塊">
						{(["heading", "paragraph", "image", "button", "divider", "videoCard", "coupon", "course", "countdown"] as const).map((type) => (
							<button key={type} type="button" className="rounded-md border px-3 py-2 text-sm" data-testid={`add-${type}`} onClick={() => setBlocks((current) => [...current, newBlock(type)])}>
								＋{blockLabel(type)}
							</button>
						))}
					</div>

					<div className="space-y-3">
						{blocks.map((block, index) => {
							const props = getBlockProps(block);
							return <article key={`${block.type}-${index}`} className="space-y-3 rounded-lg border p-4" data-testid="newsletter-block">
								<div className="flex items-center justify-between gap-2">
									<strong className="text-sm">{index + 1}. {blockLabel(block.type)}</strong>
									<button type="button" className="text-sm text-destructive" onClick={() => setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index))}>移除</button>
								</div>
								{(block.type === "heading" || block.type === "paragraph") && (
									<textarea className="min-h-20 w-full rounded-md border p-2" data-testid={`block-content-${index}`} value={typeof block.content === "string" ? block.content : ""} onChange={(event) => updateBlock(index, { content: event.target.value })} />
								)}
								{(block.type === "image" || block.type === "button" || block.type === "video" || block.type === "videoCard") && (
									<div className="grid gap-2 sm:grid-cols-2">
										{(block.type === "button" || block.type === "video" || block.type === "videoCard") && <input className="h-10 rounded-md border px-3" aria-label={`${blockLabel(block.type)}標題`} value={String(props.text ?? props.title ?? "")} onChange={(event) => updateProp(index, block.type === "button" ? "text" : "title", event.target.value)} placeholder="標題" />}
										<input className="h-10 rounded-md border px-3" aria-label={`${blockLabel(block.type)}網址`} value={String(props.url ?? props.src ?? "")} onChange={(event) => updateProp(index, block.type === "image" ? "src" : "url", event.target.value)} placeholder="網址" />
										{block.type === "image" && <input className="h-10 rounded-md border px-3" aria-label="圖片替代文字" value={String(props.alt ?? "")} onChange={(event) => updateProp(index, "alt", event.target.value)} placeholder="替代文字" />}
									</div>
								)}
								{block.type === "coupon" && (
									<div className="grid gap-2 sm:grid-cols-2">
										<input className="h-10 rounded-md border px-3" aria-label="優惠券代碼" value={String(props.code ?? "")} readOnly={props.codeReadOnly === true} onChange={(event) => updateProp(index, "code", event.target.value)} placeholder="優惠碼" />
										<input className="h-10 rounded-md border px-3" aria-label="優惠券截止日期" value={String(props.expiresAt ?? "")} onChange={(event) => updateProp(index, "expiresAt", event.target.value)} placeholder="expiresAt ISO" />
									</div>
								)}
								{block.type === "course" && (
									<div className="grid gap-2 sm:grid-cols-2">
										<input className="h-10 rounded-md border px-3" aria-label="課程標題" value={String(props.title ?? "")} onChange={(event) => updateProp(index, "title", event.target.value)} placeholder="課程標題" />
										<input className="h-10 rounded-md border px-3" aria-label="課程價格" value={String(props.priceLabel ?? "")} readOnly={props.priceReadOnly === true} onChange={(event) => updateProp(index, "priceLabel", event.target.value)} placeholder="價格標籤" />
										<input className="h-10 rounded-md border px-3" aria-label="課程網址" value={String(props.url ?? "")} readOnly={props.urlReadOnly === true} onChange={(event) => updateProp(index, "url", event.target.value)} placeholder="/courses/..." />
										<input className="h-10 rounded-md border px-3" aria-label="課程封面" value={String(props.imageUrl ?? "")} onChange={(event) => updateProp(index, "imageUrl", event.target.value)} placeholder="封面網址" />
									</div>
								)}
								{block.type === "countdown" && (
									<div className="grid gap-2 sm:grid-cols-2">
										<input className="h-10 rounded-md border px-3" aria-label="倒數文字" value={String(props.text ?? "")} onChange={(event) => updateProp(index, "text", event.target.value)} placeholder="倒數文字" />
										<input className="h-10 rounded-md border px-3" aria-label="倒數截止時間" value={String(props.expiresAt ?? "")} onChange={(event) => updateProp(index, "expiresAt", event.target.value)} placeholder="expiresAt ISO" />
									</div>
								)}
							</article>
						})}
					</div>
				</section>

				<section className="space-y-4 rounded-xl border bg-muted/20 p-5" aria-label="電子報預覽">
					<div className="flex items-center justify-between gap-3">
						<h2 className="font-semibold">即時預覽</h2>
						<span className="text-sm text-muted-foreground">{rendered.sizeBytes.toLocaleString()} bytes</span>
					</div>
					{rendered.warnings.map((warning) => <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" key={warning}>{warning}</p>)}
					<iframe title="電子報 HTML 預覽" srcDoc={rendered.html} className="min-h-[520px] w-full rounded-md border bg-white" sandbox="" />
				</section>
			</div>

			<section className="space-y-4 rounded-xl border bg-card p-5" aria-label="寄送控制">
				<h2 className="font-semibold">寄送</h2>
				{onPrepareAudience && (
					<div className="space-y-3 rounded-md border p-4" data-testid="newsletter-audience">
						<p className="text-sm font-medium">分眾</p>
						<div className="flex flex-wrap gap-3 text-sm">
							<label className="flex items-center gap-2">
								<input type="radio" name="audience-preset" checked={audiencePreset === "manual"} onChange={() => setAudiencePreset("manual")} />
								手動信箱（少量）
							</label>
							<label className="flex items-center gap-2">
								<input type="radio" name="audience-preset" checked={audiencePreset === "all"} onChange={() => setAudiencePreset("all")} />
								全部收件人
							</label>
						</div>
						{audiencePreset === "manual" && (
							<input
								id="newsletter-manual-emails"
								className="h-10 w-full rounded-md border px-3 text-sm"
								placeholder="staff@example.com"
								value={manualEmails}
								onChange={(event) => setManualEmails(event.target.value)}
							/>
						)}
						<button
							id="newsletter-prepare-audience"
							type="button"
							className="rounded-md border px-3 py-2 text-sm"
							disabled={audienceState === "saving"}
							onClick={() => void prepareAudience()}
						>
							{audienceState === "saving" ? "套用中…" : "套用分眾並產生收件人"}
						</button>
						{audienceError && <p className="text-sm text-destructive" role="alert">{audienceError}</p>}
						{audienceState === "saved" && !audienceError && (
							<p className="text-sm text-muted-foreground" role="status">分眾已更新。</p>
						)}
					</div>
				)}
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<label className="grid gap-2 text-sm font-medium" htmlFor="newsletter-test-recipient">測試信收件人（僅限內部帳號）</label>
						<div className="flex gap-2">
							<input id="newsletter-test-recipient" type="email" value={testRecipient} onChange={(event) => setTestRecipient(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border px-3" placeholder="staff@example.com" />
							<button id="newsletter-send-test" type="button" className="rounded-md border px-3 text-sm" disabled={testState === "sending"} onClick={() => void sendTest()}>{testState === "sending" ? "寄送中…" : "寄測試信"}</button>
						</div>
						{testError && <p className="text-sm text-muted-foreground" role="status">{testError}</p>}
					</div>
					<div className="rounded-md bg-muted/30 p-3 text-sm">
						<p>預估收件人數：<strong>{recipientEstimate}</strong></p>
						{recipientEstimate <= 0 && <p className="mt-1 text-destructive">沒有可寄送的收件人。</p>}
						{sendError && <p className="mt-1 text-destructive" role="alert">{sendError}</p>}
					</div>
				</div>
				<button id="newsletter-send-campaign" type="button" className="rounded-md bg-primary px-4 py-2 text-primary-foreground" disabled={recipientEstimate <= 0 || rendered.isOversized || sendState !== "idle"} onClick={() => setConfirmOpen(true)}>
					{sendState === "sent" ? "已進入發送佇列" : "發送電子報"}
				</button>
			</section>

			{confirmOpen && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="newsletter-confirm-title">
					<div className="w-full max-w-md space-y-5 rounded-xl bg-background p-6 shadow-xl">
						<div>
							<h2 id="newsletter-confirm-title" className="text-lg font-semibold">確認發送</h2>
							<p className="mt-1 text-sm text-muted-foreground">確認後會進入發送流程，無法重複提交。</p>
						</div>
						<dl className="space-y-2 text-sm">
							<div className="flex justify-between gap-3"><dt>類型</dt><dd>{campaign.type === "PROMO" ? "促銷" : "一般"}</dd></div>
							<div className="flex justify-between gap-3"><dt>主旨</dt><dd className="max-w-[70%] text-right">{subject || "（未填）"}</dd></div>
							<div className="flex justify-between gap-3"><dt>寄件人</dt><dd>{campaign.senderName || "沿用系統設定"}</dd></div>
							<div className="flex justify-between gap-3 font-semibold"><dt>預估收件人數</dt><dd>{recipientEstimate}</dd></div>
						</dl>
						<div className="flex justify-end gap-2">
							<button type="button" className="rounded-md border px-4 py-2 text-sm" disabled={sendState === "sending" || sendState === "sent"} onClick={() => setConfirmOpen(false)}>取消</button>
							<button id="newsletter-confirm-send" type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" disabled={sendState !== "idle"} onClick={() => void sendCampaign()}>{sendState === "sending" ? "發送中…" : sendState === "sent" ? "已送出" : "確認發送"}</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
