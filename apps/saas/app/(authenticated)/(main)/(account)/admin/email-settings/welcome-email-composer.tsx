"use client";

import { useMemo, useState } from "react";
import { BlockNoteSchema, defaultBlockSpecs, type PartialBlock } from "@blocknote/core";
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { zhTW } from "@blocknote/core/locales";
import { createReactBlockSpec, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { MantineProvider } from "@mantine/core";

import "@blocknote/core/fonts/inter.css";
import "@mantine/core/styles.css";
import "@blocknote/mantine/style.css";

export type WelcomeEmailBlock = PartialBlock;

type WelcomeEmailComposerProps = {
	value: WelcomeEmailBlock[] | null;
	onChange: (blocks: WelcomeEmailBlock[]) => void;
};

function updateCustomBlock(editor: unknown, block: unknown, props: Record<string, string>) {
	(editor as { updateBlock: (block: unknown, update: unknown) => unknown }).updateBlock(block, { props });
}

const ctaButtonBlock = createReactBlockSpec(
	{
		type: "ctaButton",
		propSchema: {
			text: { default: "開始上課" },
			url: { default: "{{courseUrl}}" },
		},
		content: "none",
	},
	{
		render: ({ block, editor }) => (
			<div className="rounded-lg border bg-white p-3">
				<div className="mb-2 text-xs font-medium text-muted-foreground">CTA 按鈕</div>
				<div className="grid gap-2 sm:grid-cols-[1fr_1.4fr]">
					<input
						className="h-9 rounded-md border px-3 text-sm"
						value={String(block.props.text || "")}
						onChange={(event) =>
							updateCustomBlock(editor, block, {
								text: event.target.value,
								url: String(block.props.url || ""),
							})
						}
						placeholder="按鈕文字"
					/>
					<input
						className="h-9 rounded-md border px-3 text-sm"
						value={String(block.props.url || "")}
						onChange={(event) =>
							updateCustomBlock(editor, block, {
								text: String(block.props.text || ""),
								url: event.target.value,
							})
						}
						placeholder="連結網址"
					/>
				</div>
			</div>
		),
	},
);

const welcomeEmailSchema = BlockNoteSchema.create({
	blockSpecs: {
		...defaultBlockSpecs,
		ctaButton: ctaButtonBlock(),
	},
});

function parseInitialContent(value: WelcomeEmailBlock[] | null): PartialBlock[] {
	if (Array.isArray(value) && value.length > 0) {
		return value as PartialBlock[];
	}
	return [{ type: "paragraph", content: "" }];
}

export default function WelcomeEmailComposer({ value, onChange }: WelcomeEmailComposerProps) {
	const [initialContent] = useState(() => parseInitialContent(value));

	const editor = useCreateBlockNote(
		{
			schema: welcomeEmailSchema,
			initialContent,
			dictionary: zhTW,
		},
		[],
	);

	const slashItems = useMemo(
		() => [
			{
				title: "一級標題",
				subtext: "歡迎信主標題",
				aliases: ["h1", "標題"],
				group: "文字",
				onItemClick: () =>
					insertOrUpdateBlockForSlashMenu(editor, { type: "heading", props: { level: 1 } }),
			},
			{
				title: "段落",
				subtext: "一般文字",
				aliases: ["p", "paragraph"],
				group: "文字",
				onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "paragraph" }),
			},
			{
				title: "項目清單",
				subtext: "無序清單",
				aliases: ["ul", "list"],
				group: "文字",
				onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "bulletListItem" }),
			},
			{
				title: "編號清單",
				subtext: "有序清單",
				aliases: ["ol"],
				group: "文字",
				onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "numberedListItem" }),
			},
			{
				title: "引用",
				subtext: "引用文字",
				aliases: ["quote"],
				group: "文字",
				onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "quote" }),
			},
			{
				title: "CTA 按鈕",
				subtext: "置中行動按鈕",
				aliases: ["button", "cta", "按鈕"],
				group: "行動",
				onItemClick: () =>
					insertOrUpdateBlockForSlashMenu(editor, {
						type: "ctaButton",
						props: { text: "開始上課", url: "{{courseUrl}}" },
					}),
			},
		],
		[editor],
	);

	return (
		<MantineProvider>
			<div className="welcome-email-blocknote rounded-md border bg-white" data-testid="welcome-email-composer">
				<BlockNoteView
					editor={editor}
					theme="light"
					slashMenu={false}
					onChange={() => {
						onChange(editor.document as WelcomeEmailBlock[]);
					}}
				>
					<SuggestionMenuController
						triggerCharacter="/"
						getItems={async (query) => filterSuggestionItems(slashItems, query)}
					/>
				</BlockNoteView>
			</div>
		</MantineProvider>
	);
}
