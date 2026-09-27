import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb } = vi.hoisted(() => {
	const mockDb = {
		member: {
			findMany: vi.fn(async () => []),
		},
		user: {
			findUnique: vi.fn(async () => ({ role: "user" })),
		},
		course: {
			findFirst: vi.fn(async () => null),
		},
		order: {
			findMany: vi.fn(async ({ where }: any) => {
				if (where?.courseAccess === true) {
					return [];
				}
				return [{ sku: "startkiter-mvp", courseAccess: false }];
			}),
			findFirst: vi.fn(async ({ where }: any) => {
				if (where?.sku === "startkiter-mvp" && where?.kitClaimEligible === true) {
					if (where?.courseAccess === true) {
						return null;
					}
					return { id: "ord-refunded", orderNo: "SK-REFUNDED" };
				}
				return null;
			}),
		},
		githubKitGrant: {
			findFirst: vi.fn(async () => null),
			findMany: vi.fn(async () => []),
		},
	};
	return { mockDb };
});

vi.mock("@auth/lib/server", () => ({
	getSession: vi.fn(),
}));

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/api/modules/course/lib/published-content-cache", () => ({
	getCachedPublishedCurriculum: vi.fn(async () => []),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn(async () => (key: string) => `[t:${key}]`),
}));

vi.mock("./(authenticated)/(main)/(account)/course/course-review-panel", () => ({
	CourseReviewPanel: () => null,
}));

vi.mock("../lib/github-kit", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../lib/github-kit")>();
	return {
		...actual,
		loadGithubKitRuntime: () => ({
			config: {
				appId: "1",
				installationId: "2",
				privateKeyPem: "-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----",
				org: "startkiter",
				repo: "shared-kit",
				templateRepo: "startkiter/kit-template",
			},
			oauthConfigured: true,
		}),
		createConfiguredCollaboratorClient: () => ({
			generateRepoFromTemplate: vi.fn(),
			inviteWriteCollaborator: vi.fn(),
			removeCollaborator: vi.fn(),
		}),
		createPrismaGithubIdentityReaderWithUserApi: () => ({
			getGithubIdentity: async () => ({ githubUserId: "42", githubLogin: "bob-dev" }),
		}),
	};
});

vi.mock("../../packages/database/prisma/client", () => ({
	db: mockDb,
}));

vi.mock("../../../packages/database/prisma/client", () => ({
	db: mockDb,
}));

vi.mock("@startkiter/database", async (importOriginal) => {
	const actual = await importOriginal<any>();
	return {
		...actual,
		db: mockDb,
	};
});

import { getSession } from "@auth/lib/server";
import { auth } from "@startkiter/auth";
import CoursePage from "./(authenticated)/(main)/(account)/course/page";
import { POST } from "./api/github/claim/route";

describe("退款訂單領取資格防護（courseAccess=false 但 kitClaimEligible=true）", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getSession).mockResolvedValue({
			user: { id: "user-refunded", email: "refunded@example.com" },
			session: { id: "sess-refunded" },
		} as never);

		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "user-refunded", email: "refunded@example.com" },
			session: { id: "sess-refunded" },
		} as never);
	});

	it("courseAccess=false 但 kitClaimEligible=true 時不顯示領取代碼包按鈕", async () => {
		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		expect(html).not.toContain("領取代碼包");
		expect(html).not.toContain('data-testid="kit-claim-button"');
	});

	it("courseAccess=false 但 kitClaimEligible=true 時直接呼叫 POST /api/github/claim 會被 403 拒絕", async () => {
		const request = new Request("http://localhost/api/github/claim", { method: "POST" });
		const response = await POST(request);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: "not_eligible" });
	});
});
