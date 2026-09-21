import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { assertNoForbiddenWorkspaceNouns } from "./navigation";

const FORBIDDEN_COPY_PATHS = [
	"apps/saas/modules",
	"docs/ux/startkiter-sr-architecture-focus.html",
] as const;

function collectFiles(root: string): string[] {
	const stat = statSync(root);
	if (stat.isFile()) {
		return [root];
	}
	return readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
		collectFiles(join(root, entry.name)),
	);
}

export function scanWorkspaceCopy(repositoryRoot: string): void {
	const violations: string[] = [];
	for (const relativePath of FORBIDDEN_COPY_PATHS) {
		const absolutePath = join(repositoryRoot, relativePath);
		for (const file of collectFiles(absolutePath)) {
			if (!/\.(ts|tsx|js|jsx|html)$/.test(file) || /\.test\.[^.]+$/.test(file)) {
				continue;
			}
			const copy = readFileSync(file, "utf8");
			try {
				assertNoForbiddenWorkspaceNouns(copy);
			} catch (error) {
				violations.push(`${relative(repositoryRoot, file)}: ${String(error)}`);
			}
		}
	}

	if (violations.length > 0) {
		throw new Error(`FORBIDDEN_WORKSPACE_COPY:\n${violations.join("\n")}`);
	}
}
