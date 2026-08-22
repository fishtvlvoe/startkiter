"use client";

import { useChat } from "@ai-sdk/react";
import { eventIteratorToStream } from "@orpc/client";
import { cn } from "@startkiter/ui";
import { Button } from "@startkiter/ui/components/button";
import { Textarea } from "@startkiter/ui/components/textarea";
import { toastError } from "@startkiter/ui/components/toast";
import { orpcClient } from "@shared/lib/orpc-client";
import {
	ArrowUpIcon,
	CodeIcon,
	DownloadIcon,
	EllipsisIcon,
	LightbulbIcon,
	MailIcon,
	TrendingUpIcon,
} from "lucide-react";

import "streamdown/styles.css";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

const PROMPT_SUGGESTIONS = [
	{
		icon: CodeIcon,
		text: "Help me debug a React component",
		prompt: "Help me debug a React component",
	},
	{
		icon: MailIcon,
		text: "Write a professional email",
		prompt: "Write a professional email",
	},
	{
		icon: LightbulbIcon,
		text: "Explain how to optimize database queries",
		prompt: "Explain how to optimize database queries",
	},
	{
		icon: TrendingUpIcon,
		text: "Summarize the latest AI trends",
		prompt: "Summarize the latest AI trends",
	},
] as const;

type SpreadsheetToolOutput =
	| { error: string }
	| { format: "html"; html: string }
	| { format: "xlsx"; filename: string; contentType: string; data: string };

interface SpreadsheetToolPart {
	state: string;
	output?: unknown;
	errorText?: string;
}

/** 渲染 generateSpreadsheet 工具的結果：xlsx 給下載連結，html 給 iframe 預覽。 */
function SpreadsheetToolResult({ part }: { part: SpreadsheetToolPart }) {
	if (part.state === "input-streaming" || part.state === "input-available") {
		return (
			<div className="max-w-2xl px-4 py-2 text-sm text-muted-foreground">正在產生報表…</div>
		);
	}

	if (part.state === "output-error") {
		return (
			<div className="max-w-2xl rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
				報表產生失敗：{part.errorText || "未知錯誤"}
			</div>
		);
	}

	const output = part.output as SpreadsheetToolOutput | undefined;
	if (!output) return null;

	if ("error" in output) {
		return (
			<div className="max-w-2xl rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
				{output.error}
			</div>
		);
	}

	if (output.format === "html") {
		return (
			<iframe
				title="報表預覽"
				srcDoc={output.html}
				className="h-96 w-full max-w-2xl rounded-lg border bg-white"
			/>
		);
	}

	const href = `data:${output.contentType};base64,${output.data}`;
	return (
		<a
			href={href}
			download={output.filename}
			className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
		>
			<DownloadIcon className="size-4" />
			下載這份 Excel（{output.filename}）
		</a>
	);
}

export function AiChat() {
	const [input, setInput] = useState("");
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	const { messages, status, sendMessage } = useChat({
		id: "local-chat",
		transport: {
			async sendMessages(options) {
				return eventIteratorToStream(
					await orpcClient.ai.stream(
						{
							messages: options.messages,
						},
						{ signal: options.abortSignal },
					),
				);
			},
			reconnectToStream() {
				throw new Error("Unsupported");
			},
		},
	});

	const handleSubmit = async (
		e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>,
	) => {
		e.preventDefault();

		const text = input.trim();
		if (!text) {
			return;
		}
		setInput("");

		try {
			await sendMessage({
				text,
			});
		} catch {
			toastError("Failed to send message");
			setInput(text);
		}
	};

	useEffect(() => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
		}
	}, [messages.length, status]);

	return (
		<div className="max-w-3xl mx-auto flex h-[calc(100vh-10rem)] flex-col">
			<div ref={messagesContainerRef} className="gap-4 py-8 flex flex-1 flex-col overflow-y-auto">
				{messages.length === 0 && (
					<div className="gap-6 flex flex-1 flex-col items-center justify-center">
						<div className="gap-4 sm:grid-cols-2 grid w-full grid-cols-1">
							{PROMPT_SUGGESTIONS.map((suggestion, index) => {
								const Icon = suggestion.icon;
								return (
									<Button
										key={index}
										type="button"
										variant="outline"
										onClick={async () => {
											try {
												await sendMessage({
													text: suggestion.prompt,
												});
											} catch {
												toastError("Failed to send message");
											}
										}}
										disabled={status === "streaming"}
										className="group gap-2 p-4 h-auto rounded-2xl bg-card text-center"
									>
										<Icon className="size-6 text-primary" />
										<span className="text-sm text-foreground">{suggestion.text}</span>
									</Button>
								);
							})}
						</div>
					</div>
				)}

				{messages.map((message, index) => (
					<div
						key={index}
						className={cn(
							"gap-2 flex flex-col",
							message.role === "user" ? "items-end" : "items-start",
						)}
					>
						<div
							className={cn(
								"max-w-2xl gap-2 px-4 py-2 flex items-center rounded-lg text-foreground **:max-w-full",
								message.role === "user"
									? "bg-primary/10 whitespace-pre-wrap"
									: "prose prose-sm dark:prose-invert bg-muted",
							)}
						>
							{message.parts?.map((part, index) =>
								part.type === "text" ? (
									message.role === "user" ? (
										<span key={index}>{part.text}</span>
									) : (
										<Streamdown
											key={index}
											animated
											isAnimating={
												status === "streaming" &&
												message.parts != null &&
												index === message.parts.length - 1
											}
											className="wrap-break-words"
										>
											{part.text}
										</Streamdown>
									)
								) : null,
							)}
						</div>

						{message.parts?.map((part, index) =>
							part.type === "tool-generateSpreadsheet" ? (
								<SpreadsheetToolResult key={index} part={part} />
							) : null,
						)}
					</div>
				))}

				{(status === "streaming" || status === "submitted") && (
					<div className="flex justify-start">
						<div className="max-w-2xl gap-2 px-4 py-2 flex items-center rounded-lg bg-secondary/10 text-foreground">
							<EllipsisIcon className="size-6 animate-pulse" />
						</div>
					</div>
				)}
			</div>

			<form
				onSubmit={handleSubmit}
				className="text-lg relative shrink-0 rounded-2xl bg-card focus-within:ring focus-within:ring-primary focus-within:outline-none"
			>
				<Textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Chat with your AI..."
					className="min-h-8 p-6 pr-14 rounded-2xl border bg-card shadow-none focus:outline-hidden focus-visible:ring-0"
					onKeyDown={async (e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							await handleSubmit(e);
						}
					}}
				/>

				<Button
					type="submit"
					size="icon"
					variant="primary"
					className="right-3 bottom-3 absolute bg-touch text-touch-foreground hover:bg-touch/90"
					disabled={!input.trim() || status === "streaming"}
				>
					<ArrowUpIcon className="size-4" />
				</Button>
			</form>
		</div>
	);
}
