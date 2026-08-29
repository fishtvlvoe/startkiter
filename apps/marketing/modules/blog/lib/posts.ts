import type { Post } from "@blog/types";
import { config as i18nConfig } from "@i18n/config";
import { getLocalizedDocumentWithFallback, getUniqueBasePaths } from "@shared/lib/content";
import { allPosts } from "content-collections";

import { listPublishedDatabasePages, type DatabasePublicPage } from "./database-pages";

const defaultLocale = i18nConfig.defaultLocale;

function toPost(page: DatabasePublicPage): Post {
	return {
		title: page.title,
		date: (page.publishedAt ?? page.updatedAt).toISOString(),
		image: page.coverImageUrl ?? undefined,
		authorName: "",
		excerpt: page.excerpt ?? undefined,
		tags: page.tags,
		published: true,
		content: page.body,
		body: page.body,
		locale: page.locale,
		path: page.slug,
		htmlBody: page.body,
	} as Post;
}

/**
 * Returns paths of all published posts for use in generateStaticParams.
 */
export function getPublishedPostPaths(): string[] {
	const paths = getUniqueBasePaths(allPosts);
	return paths.filter((path) => {
		const post = getLocalizedDocumentWithFallback(allPosts, path, defaultLocale, {
			defaultLocale,
		});
		return post?.published === true;
	});
}

/**
 * Returns all posts for the given locale. Always includes default-language posts;
 * localized versions (e.g. .de.mdx) overwrite content only when they exist.
 */
export async function getAllPosts(locale?: string): Promise<Post[]> {
	const resolvedLocale = locale ?? defaultLocale;
	const paths = getUniqueBasePaths(allPosts);

	const filePosts = paths
		.map((path) =>
			getLocalizedDocumentWithFallback(allPosts, path, resolvedLocale, {
				defaultLocale,
			}),
		)
		.filter((post): post is NonNullable<typeof post> => post != null)
		.filter((post) => post.published);

	const dbPosts = (await listPublishedDatabasePages("POST"))
		.filter((page) => page.locale === resolvedLocale || page.locale === defaultLocale)
		.map(toPost);

	const byPath = new Map<string, Post>();
	for (const post of filePosts) {
		byPath.set(post.path, post);
	}
	for (const post of dbPosts) {
		if (post.locale === resolvedLocale || !byPath.has(post.path)) {
			byPath.set(post.path, post);
		}
	}

	return [...byPath.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Returns a post by slug for the given locale. Falls back to default-language
 * content when no localized version exists.
 */
export async function getPostBySlug(
	slug: string,
	options?: {
		locale?: string;
	},
): Promise<Post | null> {
	const resolvedLocale = options?.locale ?? defaultLocale;
	const filePost = getLocalizedDocumentWithFallback(allPosts, slug, resolvedLocale, {
		defaultLocale,
	});
	if (filePost) {
		return filePost;
	}

	const dbPosts = await listPublishedDatabasePages("POST");
	const dbPost =
		dbPosts.find((page) => page.slug === slug && page.locale === resolvedLocale) ??
		dbPosts.find((page) => page.slug === slug && page.locale === defaultLocale) ??
		null;

	return dbPost ? toPost(dbPost) : null;
}
