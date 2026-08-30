import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/storage", () => ({
	getSignedUrl: vi.fn(),
}));

import { getSignedUrl } from "@startkiter/storage";

import { GET } from "./route";

async function proxyGet(segments: string[]) {
	return GET(new Request("http://localhost/image-proxy/" + segments.join("/")), {
		params: Promise.resolve({ path: segments }),
	});
}

describe("GET /image-proxy (SSRF allowlist)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getSignedUrl).mockResolvedValue("https://cdn.example/avatars/user-1.png?X-Amz-Expires=3600");
	});

	it("redirects allowlisted avatar keys to a time-limited signed URL", async () => {
		const response = await proxyGet(["avatars", "user-1.png"]);

		expect(response.status).toBe(307);
		expect(response.headers.get("location")).toBe("https://cdn.example/avatars/user-1.png?X-Amz-Expires=3600");
		expect(getSignedUrl).toHaveBeenCalledWith("user-1.png", { bucket: "avatars", expiresIn: 3600 });
	});

	it("redirects allowlisted media keys to a time-limited signed URL", async () => {
		const response = await proxyGet(["media", "operator-1", "cover.png"]);

		expect(response.status).toBe(307);
		expect(getSignedUrl).toHaveBeenCalledWith("operator-1/cover.png", { bucket: "media", expiresIn: 3600 });
	});

	it("rejects an assignments bucket path without contacting storage", async () => {
		const response = await proxyGet(["assignments", "submission-1", "file.pdf"]);

		expect(response.status).toBe(404);
		expect(getSignedUrl).not.toHaveBeenCalled();
	});

	it("rejects a loopback IP path the way lesson-tool SSRF tests reject private URLs", async () => {
		const response = await proxyGet(["10.0.0.1", "internal"]);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not found");
		expect(getSignedUrl).not.toHaveBeenCalled();
	});

	it("rejects an arbitrary external host path", async () => {
		const response = await proxyGet(["https:", "", "evil.example", "steal"]);

		expect(response.status).toBe(404);
		expect(getSignedUrl).not.toHaveBeenCalled();
	});

	it("rejects a case-shifted bucket name so the allowlist cannot be bypassed", async () => {
		const response = await proxyGet(["AVATARS", "user-1.png"]);

		expect(response.status).toBe(404);
		expect(getSignedUrl).not.toHaveBeenCalled();
	});

	it("rejects a percent-encoded host disguised as a bucket", async () => {
		const response = await proxyGet(["127.0.0.1%2fadmin"]);

		expect(response.status).toBe(400);
		expect(getSignedUrl).not.toHaveBeenCalled();
	});
});
