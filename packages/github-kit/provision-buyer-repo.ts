import type { GithubCollaboratorClient, GithubKitConfig } from "./types";

export function dedicatedRepoName(orderId: string): string {
	return `kit-${orderId}`;
}

export function parseTemplateRepo(
	raw: string,
	fallbackOrg: string,
): { owner: string; repo: string } {
	const trimmed = raw.trim();
	const slash = trimmed.indexOf("/");
	if (slash > 0 && slash < trimmed.length - 1) {
		return {
			owner: trimmed.slice(0, slash),
			repo: trimmed.slice(slash + 1),
		};
	}
	return { owner: fallbackOrg, repo: trimmed };
}

export async function provisionBuyerRepo(args: {
	config: GithubKitConfig;
	orderId: string;
	githubLogin: string;
	collaborators: GithubCollaboratorClient;
}): Promise<{ org: string; repo: string }> {
	const template = parseTemplateRepo(args.config.templateRepo, args.config.org);
	const repo = dedicatedRepoName(args.orderId);
	await args.collaborators.generateRepoFromTemplate({
		templateOwner: template.owner,
		templateRepo: template.repo,
		owner: args.config.org,
		name: repo,
	});
	await args.collaborators.inviteWriteCollaborator({
		org: args.config.org,
		repo,
		username: args.githubLogin,
	});
	return { org: args.config.org, repo };
}
