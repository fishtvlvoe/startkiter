import { call } from "@orpc/server";
import type { Session } from "@startkiter/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		buyerDeployment: {
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/logs", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@startkiter/platform", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@startkiter/platform")>();
	return {
		...actual,
		addServerToCoolify: vi.fn(),
		createApplication: vi.fn(),
		setApplicationEnv: vi.fn(),
		redeployApplication: vi.fn(),
		findBuyerDeploymentForUser: vi.fn(),
		upsertBuyerDeployment: vi.fn(),
	};
});

import { auth } from "@startkiter/auth";
import { logger } from "@startkiter/logs";
import {
	addServerToCoolify,
	createApplication,
	findBuyerDeploymentForUser,
	redeployApplication,
	setApplicationEnv,
	upsertBuyerDeployment,
} from "@startkiter/platform";

import { provisionServer } from "./provision-server";
import { submitCredential } from "./submit-credential";

const authenticatedSession = {
	session: {
		id: "session-1",
		createdAt: new Date(),
		updatedAt: new Date(),
		userId: "user-1",
		expiresAt: new Date(Date.now() + 60_000),
		token: "session-token",
		ipAddress: null,
		userAgent: null,
		impersonatedBy: null,
		activeOrganizationId: null,
	},
	user: {
		id: "user-1",
		name: "Test User",
		email: "test@example.com",
		emailVerified: true,
		image: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		role: "user",
		banned: null,
		banReason: null,
		onboardingComplete: true,
		locale: null,
		twoFactorEnabled: false,
		lastActiveOrganizationId: null,
	},
} satisfies Session;

const PUBLIC_KEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5";

function serializedLogs(): string {
	return JSON.stringify([vi.mocked(logger.info).mock.calls, vi.mocked(logger.error).mock.calls]);
}

describe("provisionServer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(authenticatedSession);
		process.env.COOLIFY_API_TOKEN = "coolify-token";
		process.env.COOLIFY_PROJECT_UUID = "proj_1";
		process.env.COOLIFY_APP_REPO_URL = "https://github.com/example/app";
		process.env.COOLIFY_APP_GIT_BRANCH = "main";
		delete process.env.COOLIFY_PRIVATE_KEY_UUID;
	});

	it("registers the VPS with Coolify and persists BuyerDeployment", async () => {
		vi.mocked(addServerToCoolify).mockResolvedValue({ ok: true, data: { uuid: "srv_1" } });
		vi.mocked(createApplication).mockResolvedValue({ ok: true, data: { uuid: "app_1" } });
		vi.mocked(upsertBuyerDeployment).mockResolvedValue({
			id: "dep_1",
			userId: "user-1",
			tier: "managed",
			coolifyServerId: "srv_1",
			coolifyAppId: "app_1",
			publicUrl: "https://45.76.187.247",
			status: "provisioning",
		});

		await expect(
			call(
				provisionServer,
				{ tier: "managed", ip: "45.76.187.247", publicKey: PUBLIC_KEY },
				{ context: { headers: new Headers() } },
			),
		).resolves.toEqual({ accepted: true });

		expect(addServerToCoolify).toHaveBeenCalledWith(
			expect.objectContaining({
				ip: "45.76.187.247",
				name: "buyer-user-1",
				apiToken: "coolify-token",
			}),
		);
		expect(createApplication).toHaveBeenCalledWith(
			expect.objectContaining({
				serverId: "srv_1",
				repoUrl: "https://github.com/example/app",
				branch: "main",
				projectUuid: "proj_1",
			}),
		);
		expect(upsertBuyerDeployment).toHaveBeenCalledWith({
			userId: "user-1",
			tier: "managed",
			coolifyServerId: "srv_1",
			coolifyAppId: "app_1",
			publicUrl: "https://45.76.187.247",
			status: "provisioning",
		});
	});

	it("returns 503 when Coolify add-server fails", async () => {
		vi.mocked(addServerToCoolify).mockResolvedValue({ ok: false, kind: "api_error" });

		await expect(
			call(
				provisionServer,
				{ tier: "managed", ip: "45.76.187.247", publicKey: PUBLIC_KEY },
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({
			code: "INTERNAL_SERVER_ERROR",
		});
		expect(createApplication).not.toHaveBeenCalled();
	});
});

describe("submitCredential", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(authenticatedSession);
		process.env.COOLIFY_API_TOKEN = "coolify-token";
		vi.mocked(findBuyerDeploymentForUser).mockResolvedValue({
			id: "dep_1",
			userId: "user-1",
			tier: "managed",
			coolifyAppId: "app_1",
			publicUrl: "https://buyer-1.startkiter.dev",
			status: "live",
		});
	});

	it("rejects a targetEnvKey outside the allowlist and does not write env", async () => {
		await expect(
			call(
				submitCredential,
				{
					kind: "payment",
					targetEnvKey: "SOME_RANDOM_ENV_KEY",
					value: "sk_live_super_secret",
				},
				{ context: { headers: new Headers() } },
			),
		).rejects.toBeDefined();

		expect(setApplicationEnv).not.toHaveBeenCalled();
		expect(redeployApplication).not.toHaveBeenCalled();
		expect(serializedLogs()).not.toContain("sk_live_super_secret");
	});

	it("rejects a mismatched kind/key pair without writing", async () => {
		await expect(
			call(
				submitCredential,
				{
					kind: "payment",
					targetEnvKey: "CLOUDFLARE_DNS_TOKEN",
					value: "sk_live_super_secret",
				},
				{ context: { headers: new Headers() } },
			),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		expect(setApplicationEnv).not.toHaveBeenCalled();
		expect(redeployApplication).not.toHaveBeenCalled();
		expect(serializedLogs()).not.toContain("sk_live_super_secret");
	});

	it("forwards an allowlisted credential to Coolify env then redeploys, without logging the value", async () => {
		vi.mocked(setApplicationEnv).mockResolvedValue({ ok: true, data: { uuid: "env_1" } });
		vi.mocked(redeployApplication).mockResolvedValue({ ok: true, data: { queued: true } });

		await expect(
			call(
				submitCredential,
				{
					kind: "payment",
					targetEnvKey: "PAYMENT_PROVIDER_API_KEY",
					value: "sk_live_super_secret",
				},
				{ context: { headers: new Headers() } },
			),
		).resolves.toEqual({ accepted: true });

		expect(setApplicationEnv).toHaveBeenCalledWith({
			appId: "app_1",
			key: "PAYMENT_PROVIDER_API_KEY",
			value: "sk_live_super_secret",
			apiToken: "coolify-token",
		});
		expect(redeployApplication).toHaveBeenCalledWith({ appId: "app_1", apiToken: "coolify-token" });
		expect(upsertBuyerDeployment).not.toHaveBeenCalled();
		expect(serializedLogs()).not.toContain("sk_live_super_secret");
	});
});
