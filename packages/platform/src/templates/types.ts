import type { PluginManifest } from "../types";

export type SiteTemplate = {
	id: string;
	name: string;
	description: string;
	previewImagePath: string;
	defaultMountConfig: Partial<PluginManifest>[];
	styleTokenOverrides: Record<string, string>;
	aiPromptHint: string;
};
