import { afterEach, describe, expect, it, vi } from "vitest";

import {
	addServerToCoolify,
	createApplication,
	fetchCoolifyAppLogs,
	fetchCoolifyAppStatus,
	redeployApplication,
	setApplicationEnv,
} from "./coolify-client";

const TOKEN = "coolify-token";

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("fetchCoolifyAppStatus", () => {
	it("returns a live probe on success", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				jsonResponse({
					status: "running:healthy",
					fqdn: "https://buyer-1.startkiter.dev",
					updated_at: "2026-08-18T15:00:00Z",
				}),
			),
		);

		const probe = await fetchCoolifyAppStatus("app_1", TOKEN);

		expect(probe).toEqual({
			kind: "ok",
			reachable: true,
			publicUrl: "https://buyer-1.startkiter.dev",
			lastDeployedAt: "2026-08-18T15:00:00Z",
		});
		expect(fetch).toHaveBeenCalledWith(
			"https://app.coolify.io/api/v1/applications/app_1",
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
			}),
		);
	});

	it("returns network_error when fetch throws", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));

		await expect(fetchCoolifyAppStatus("app_1", TOKEN)).resolves.toEqual({ kind: "network_error" });
	});

	it("returns api_error when Coolify responds non-OK", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Unauthorized" }, 401)));

		await expect(fetchCoolifyAppStatus("app_1", TOKEN)).resolves.toEqual({ kind: "api_error" });
	});
});

describe("fetchCoolifyAppLogs", () => {
	it("returns recent logs on success using GET", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ logs: "Ready on port 3000" })));

		await expect(fetchCoolifyAppLogs("app_1", TOKEN)).resolves.toEqual({
			kind: "ok",
			logs: "Ready on port 3000",
		});
		expect(fetch).toHaveBeenCalledWith(
			"https://app.coolify.io/api/v1/applications/app_1/logs",
			expect.objectContaining({
				method: "GET",
				headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
			}),
		);
	});

	it("returns network_error when fetch throws", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

		await expect(fetchCoolifyAppLogs("app_1", TOKEN)).resolves.toEqual({ kind: "network_error" });
	});
});

describe("addServerToCoolify", () => {
	it("returns the server uuid on success", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ uuid: "srv_1" }, 201)));

		const result = await addServerToCoolify({
			ip: "45.76.187.247",
			publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5",
			name: "buyer-user-1",
			apiToken: TOKEN,
		});

		expect(result).toEqual({ ok: true, data: { uuid: "srv_1" } });
		expect(fetch).toHaveBeenCalledWith(
			"https://app.coolify.io/api/v1/servers",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
			}),
		);
		const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(body.ip).toBe("45.76.187.247");
		expect(body.name).toBe("buyer-user-1");
		expect(body.public_key).toBe("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5");
	});

	it("returns network_error when fetch throws", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

		await expect(
			addServerToCoolify({
				ip: "45.76.187.247",
				publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5",
				name: "buyer-user-1",
				apiToken: TOKEN,
			}),
		).resolves.toEqual({ ok: false, kind: "network_error" });
	});

	it("returns api_error when Coolify responds non-OK", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Invalid" }, 422)));

		await expect(
			addServerToCoolify({
				ip: "45.76.187.247",
				publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5",
				name: "buyer-user-1",
				apiToken: TOKEN,
			}),
		).resolves.toEqual({ ok: false, kind: "api_error" });
	});
});

describe("createApplication", () => {
	it("returns the application uuid on success", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ uuid: "app_1" }, 201)));

		const result = await createApplication({
			serverId: "srv_1",
			repoUrl: "https://github.com/fishtvlvoe/startkiter-coolify-git-deploy-test",
			branch: "main",
			apiToken: TOKEN,
			projectUuid: "proj_1",
		});

		expect(result).toEqual({ ok: true, data: { uuid: "app_1" } });
		expect(fetch).toHaveBeenCalledWith(
			"https://app.coolify.io/api/v1/applications/public",
			expect.objectContaining({ method: "POST" }),
		);
		const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(body.server_uuid).toBe("srv_1");
		expect(body.git_repository).toBe("https://github.com/fishtvlvoe/startkiter-coolify-git-deploy-test");
		expect(body.git_branch).toBe("main");
		expect(body.project_uuid).toBe("proj_1");
	});

	it("returns network_error when fetch throws", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));

		await expect(
			createApplication({
				serverId: "srv_1",
				repoUrl: "https://github.com/example/app",
				branch: "main",
				apiToken: TOKEN,
				projectUuid: "proj_1",
			}),
		).resolves.toEqual({ ok: false, kind: "network_error" });
	});

	it("returns api_error when Coolify responds non-OK", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Missing project" }, 400)));

		await expect(
			createApplication({
				serverId: "srv_1",
				repoUrl: "https://github.com/example/app",
				branch: "main",
				apiToken: TOKEN,
				projectUuid: "proj_1",
			}),
		).resolves.toEqual({ ok: false, kind: "api_error" });
	});
});

describe("setApplicationEnv", () => {
	it("returns ok on success without leaking the value into the request URL", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ uuid: "env_1" }, 201)));

		const result = await setApplicationEnv({
			appId: "app_1",
			key: "PAYMENT_PROVIDER_API_KEY",
			value: "sk_live_super_secret",
			apiToken: TOKEN,
		});

		expect(result).toEqual({ ok: true, data: { uuid: "env_1" } });
		const [url, init] = vi.mocked(fetch).mock.calls[0] ?? [];
		expect(url).toBe("https://app.coolify.io/api/v1/applications/app_1/envs");
		expect(String(url)).not.toContain("sk_live_super_secret");
		expect(init?.method).toBe("POST");
		expect(JSON.parse(String(init?.body))).toEqual({
			key: "PAYMENT_PROVIDER_API_KEY",
			value: "sk_live_super_secret",
			is_shown_once: true,
		});
	});

	it("returns network_error when fetch throws", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

		await expect(
			setApplicationEnv({
				appId: "app_1",
				key: "PAYMENT_PROVIDER_API_KEY",
				value: "sk_live_super_secret",
				apiToken: TOKEN,
			}),
		).resolves.toEqual({ ok: false, kind: "network_error" });
	});

	it("returns api_error when Coolify responds non-OK", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Not found" }, 404)));

		await expect(
			setApplicationEnv({
				appId: "app_1",
				key: "PAYMENT_PROVIDER_API_KEY",
				value: "sk_live_super_secret",
				apiToken: TOKEN,
			}),
		).resolves.toEqual({ ok: false, kind: "api_error" });
	});
});

describe("redeployApplication", () => {
	it("returns ok on success", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Restart request queued." })));

		await expect(redeployApplication({ appId: "app_1", apiToken: TOKEN })).resolves.toEqual({
			ok: true,
			data: { queued: true },
		});
		expect(fetch).toHaveBeenCalledWith(
			"https://app.coolify.io/api/v1/applications/app_1/restart",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("returns network_error when fetch throws", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

		await expect(redeployApplication({ appId: "app_1", apiToken: TOKEN })).resolves.toEqual({
			ok: false,
			kind: "network_error",
		});
	});

	it("returns api_error when Coolify responds non-OK", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Forbidden" }, 403)));

		await expect(redeployApplication({ appId: "app_1", apiToken: TOKEN })).resolves.toEqual({
			ok: false,
			kind: "api_error",
		});
	});
});
