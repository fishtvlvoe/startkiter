/**
 * Shared contentJson contract for the composer and future newsletter blocks.
 * Wave 2D can extend NewsletterContentBlock with its promo block union.
 */
import type {
	NewsletterBlockContent as RenderNewsletterBlockContent,
	NewsletterButtonBlock as RenderNewsletterButtonBlock,
	NewsletterContentBlock as RenderNewsletterContentBlock,
	NewsletterContentJson as RenderNewsletterContentJson,
	NewsletterDividerBlock as RenderNewsletterDividerBlock,
	NewsletterHeadingBlock as RenderNewsletterHeadingBlock,
	NewsletterImageBlock as RenderNewsletterImageBlock,
	NewsletterInlineNode as RenderNewsletterInlineNode,
	NewsletterInlineStyles as RenderNewsletterInlineStyles,
	NewsletterParagraphBlock as RenderNewsletterParagraphBlock,
	NewsletterVideoCardBlock as RenderNewsletterVideoCardBlock,
} from "@startkiter/newsletter/lib/render";

export type NewsletterInlineStyles = RenderNewsletterInlineStyles;
export type NewsletterInlineNode = RenderNewsletterInlineNode;
export type NewsletterBlockContent = RenderNewsletterBlockContent;
export type NewsletterHeadingBlock = RenderNewsletterHeadingBlock;
export type NewsletterParagraphBlock = RenderNewsletterParagraphBlock;
export type NewsletterImageBlock = RenderNewsletterImageBlock;
export type NewsletterButtonBlock = RenderNewsletterButtonBlock;
export type NewsletterDividerBlock = RenderNewsletterDividerBlock;
export type NewsletterVideoCardBlock = RenderNewsletterVideoCardBlock;
export type NewsletterContentBlock = RenderNewsletterContentBlock;
export type NewsletterContentJson = RenderNewsletterContentJson;
