import { parseTemplateRepo } from "./provision-buyer-repo";
import type {
	GithubKitConfig,
	GithubKitGrantStore,
	GithubVersionFileReader,
} from "./types";

export type RepoVersionBody = {
	buyerVersion: string;
	latestVersion: string;
	upToDate: boolean | null;
	syncPromptHint: string;
};

export function buildSyncPromptHint(templateOwner: string, templateRepo: string): string {
	const url = `https://github.com/${templateOwner}/${templateRepo}.git`;
	return [
		`git remote add startkiter-upstream ${url}   # 只需加一次，已存在則跳過`,
		"git fetch startkiter-upstream",
		"git merge startkiter-upstream/main --allow-unrelated-histories",
	].join("\n");
}

export async function getRepoVersion(args: {
	userId: string | null | undefined;
	config: GithubKitConfig | null;
	grants: GithubKitGrantStore;
	versions: GithubVersionFileReader;
}): Promise<
	| { ok: true; body: RepoVersionBody }
	| { ok: false; httpStatus: 401; error: "authentication_required" }
> {
	if (!args.userId) {
		return { ok: false, httpStatus: 401, error: "authentication_required" };
	}

	if (!args.config) {
		return {
			ok: true,
			body: {
				buyerVersion: "",
				latestVersion: "",
				upToDate: null,
				syncPromptHint: "",
			},
		};
	}

	const grant = await args.grants.findLatestByUserId(args.userId);
	const template = parseTemplateRepo(args.config.templateRepo, args.config.org);
	const latestVersion = await args.versions.readStartkiterVersion({
		owner: template.owner,
		repo: template.repo,
	});
	const buyerVersion = grant
		? await args.versions.readStartkiterVersion({
				owner: grant.org,
				repo: grant.repo,
			})
		: null;

	const hint = buildSyncPromptHint(template.owner, template.repo);

	if (buyerVersion === null || latestVersion === null) {
		return {
			ok: true,
			body: {
				buyerVersion: buyerVersion ?? "",
				latestVersion: latestVersion ?? "",
				upToDate: null,
				syncPromptHint: "",
			},
		};
	}

	const upToDate = buyerVersion === latestVersion;
	return {
		ok: true,
		body: {
			buyerVersion,
			latestVersion,
			upToDate,
			syncPromptHint: upToDate ? "" : hint,
		},
	};
}
