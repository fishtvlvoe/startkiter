import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export type PromoteOptions = {
	sourceRoot: string;
	target?: string;
	dryRun: boolean;
	release?: string;
	skipVerify?: boolean;
	runVerify?: (targetDir: string) => Promise<void>;
};

export type PromotionReport = {
	included: string[];
	excluded: string[];
	target: string;
	dryRun: boolean;
	release?: string;
};

const DEFAULT_TARGET = "../startkiter-starter-kit";

const ALLOW_PREFIXES = [
	"apps/saas/",
	"apps/marketing/",
	"apps/docs/",
	"packages/",
	"tooling/typescript/",
	"tooling/tailwind/",
	"patches/",
];

const ALLOW_FILES = new Set([
	"package.json",
	"pnpm-workspace.yaml",
	"pnpm-lock.yaml",
	"turbo.json",
	"tsconfig.json",
	"README.md",
	".gitignore",
	"docs/core-boundary-and-extension-guide.md",
	"docs/buyer-extension-convention.md",
]);

const FORBID_PREFIXES = [
	"docs/discuss/",
	"docs/dashboard/",
	"openspec/",
	".spectra/",
	"graphify-out/",
	"legacy/",
	".vercel/",
	".zeabur/",
	"apps/saas/app/api/demo/",
	"packages/database/prisma/seed/test-users.ts",
];

const FORBID_BASENAME_PARTS = ["demo-grant-button", "demo-grant.ts"];

const SKIP_DIR_NAMES = new Set([
	"node_modules",
	".next",
	".turbo",
	".git",
	".source",
	"coverage",
	"dist",
	"playwright-report",
	"test-results",
]);

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
	{ name: "startkiter.aiver.me", pattern: /startkiter\.aiver\.me/i },
	{ name: "private-key-block", pattern: /BEGIN (RSA |OPENSSH )?PRIVATE KEY/ },
];

const ENV_KEEP = new Set([".env.example", ".env.template"]);

const isForbiddenFileName = (relativePath: string) => {
	const parts = relativePath.split("/");
	const base = parts[parts.length - 1] ?? relativePath;
	if (relativePath.endsWith(".pem") || relativePath.endsWith(".key") || relativePath.endsWith(".p12")) return true;
	if (base.startsWith(".env") && !ENV_KEEP.has(base)) return true;
	return FORBID_BASENAME_PARTS.some((part) => relativePath.includes(part));
};

const isAllowed = (relativePath: string) => {
	if (ALLOW_FILES.has(relativePath)) return true;
	return ALLOW_PREFIXES.some((prefix) => relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix));
};

const isForbidden = (relativePath: string) => {
	if (isForbiddenFileName(relativePath)) return true;
	return FORBID_PREFIXES.some((prefix) => relativePath === prefix.replace(/\/$/, "") || relativePath.startsWith(prefix));
};

const walkFiles = (root: string, current = root, acc: string[] = []) => {
	for (const entry of readdirSync(current, { withFileTypes: true })) {
		if (SKIP_DIR_NAMES.has(entry.name) || entry.name === ".DS_Store") continue;
		const full = join(current, entry.name);
		if (entry.isDirectory()) {
			walkFiles(root, full, acc);
			continue;
		}
		if (entry.isFile()) acc.push(relative(root, full));
	}
	return acc;
};

export const parseArgs = (argv: string[]): Omit<PromoteOptions, "sourceRoot"> => {
	const options: Omit<PromoteOptions, "sourceRoot"> = {
		dryRun: false,
		skipVerify: false,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--dry-run") options.dryRun = true;
		else if (arg === "--target") {
			options.target = argv[i + 1];
			i += 1;
		} else if (arg === "--release") {
			options.release = argv[i + 1];
			i += 1;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return options;
};

export const classifyPaths = (sourceRoot: string) => {
	const included: string[] = [];
	const excluded: string[] = [];

	for (const relativePath of walkFiles(sourceRoot).sort()) {
		if (isAllowed(relativePath) && !isForbidden(relativePath)) {
			included.push(relativePath);
			continue;
		}
		if (isForbidden(relativePath) || relativePath.startsWith("docs/") || relativePath.startsWith("legacy/")) {
			excluded.push(relativePath);
		}
	}

	return { included, excluded };
};

const isTestFile = (relativePath: string) => /\.test\.(ts|tsx|js|jsx)$/.test(relativePath);

export const scanForbiddenContent = (sourceRoot: string, files: string[]) => {
	const hits: string[] = [];
	for (const file of files) {
		if (isTestFile(file)) continue;
		const content = readFileSync(join(sourceRoot, file), "utf8");
		for (const { name, pattern } of SECRET_PATTERNS) {
			if (pattern.test(content)) {
				hits.push(`${file}: matched ${name}`);
			}
		}
	}
	return hits;
};

const defaultVerify = (targetDir: string) =>
	new Promise<void>((resolvePromise, reject) => {
		const child = spawn("pnpm", ["install"], { cwd: targetDir, stdio: "inherit" });
		child.on("error", reject);
		child.on("exit", (installCode) => {
			if (installCode !== 0) {
				reject(new Error(`pnpm install failed with code ${installCode}`));
				return;
			}
			const build = spawn("pnpm", ["build"], { cwd: targetDir, stdio: "inherit" });
			build.on("error", reject);
			build.on("exit", (buildCode) => {
				if (buildCode !== 0) {
					reject(new Error(`pnpm build failed with code ${buildCode}`));
					return;
				}
				const test = spawn("pnpm", ["test"], { cwd: targetDir, stdio: "inherit" });
				test.on("error", reject);
				test.on("exit", (testCode) => {
					if (testCode !== 0) {
						reject(new Error(`pnpm test failed with code ${testCode}`));
						return;
					}
					resolvePromise();
				});
			});
		});
	});

const copyIncluded = (sourceRoot: string, targetDir: string, files: string[]) => {
	for (const file of files) {
		const from = join(sourceRoot, file);
		const to = join(targetDir, file);
		mkdirSync(dirname(to), { recursive: true });
		copyFileSync(from, to);
	}
};

export const promoteCleanPackage = async (options: PromoteOptions): Promise<PromotionReport> => {
	const sourceRoot = resolve(options.sourceRoot);
	const target = resolve(sourceRoot, options.target ?? DEFAULT_TARGET);
	const { included, excluded } = classifyPaths(sourceRoot);
	const leaks = scanForbiddenContent(sourceRoot, included);
	if (leaks.length > 0) {
		throw new Error(`Forbidden content detected:\n${leaks.join("\n")}`);
	}

	const report: PromotionReport = {
		included,
		excluded,
		target,
		dryRun: options.dryRun,
		release: options.release,
	};

	if (options.dryRun) return report;

	if (!statSync(sourceRoot).isDirectory()) {
		throw new Error(`Source root does not exist: ${sourceRoot}`);
	}

	copyIncluded(sourceRoot, target, included);

	if (!options.skipVerify) {
		const verify = options.runVerify ?? defaultVerify;
		await verify(target);
	}

	return report;
};

const isDirectRun = (() => {
	const entry = process.argv[1]?.replace(/\\/g, "/");
	return Boolean(entry?.endsWith("promote-clean-package.ts") || entry?.endsWith("promote-clean-package.js"));
})();

if (isDirectRun) {
	promoteCleanPackage({
		sourceRoot: process.cwd(),
		...parseArgs(process.argv.slice(2)),
	})
		.then((report) => {
			console.log(JSON.stringify(report, null, 2));
		})
		.catch((error: unknown) => {
			console.error(error instanceof Error ? error.message : error);
			process.exitCode = 1;
		});
}
