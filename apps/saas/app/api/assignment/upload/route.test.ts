import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/api/modules/assignment/assignment-upload", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@startkiter/api/modules/assignment/assignment-upload")>();
	return {
		...actual,
		canAcceptLocalAssignmentUpload: vi.fn(),
		recordLocalAssignmentUpload: vi.fn(),
		verifyLocalAssignmentUploadToken: vi.fn(),
	};
});

vi.mock("@startkiter/database", () => ({
	db: {
		assignmentUploadIntent: {
			findFirst: vi.fn(),
			updateMany: vi.fn(),
		},
	},
}));

import {
	canAcceptLocalAssignmentUpload,
	recordLocalAssignmentUpload,
	verifyLocalAssignmentUploadToken,
} from "@startkiter/api/modules/assignment/assignment-upload";
import { db } from "@startkiter/database";

import { PUT } from "./route";

describe("PUT /api/assignment/upload local fallback", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("NODE_ENV", "test");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("is disabled in production even when a token is present", async () => {
		vi.stubEnv("NODE_ENV", "production");

		const response = await PUT(
			new Request("http://localhost/api/assignment/upload?token=guessed-key", { method: "PUT" }),
		);

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toMatchObject({
			error: "Local assignment uploads are disabled in production.",
		});
		expect(verifyLocalAssignmentUploadToken).not.toHaveBeenCalled();
	});

	it("returns 400 when the upload token is missing (no session gate; token is the credential)", async () => {
		const response = await PUT(new Request("http://localhost/api/assignment/upload", { method: "PUT" }));

		expect(response.status).toBe(400);
		expect(verifyLocalAssignmentUploadToken).not.toHaveBeenCalled();
		expect(recordLocalAssignmentUpload).not.toHaveBeenCalled();
	});

	it("returns 403 for an invalid token (cannot upload into another assignment's object)", async () => {
		vi.mocked(verifyLocalAssignmentUploadToken).mockReturnValue(null);

		const response = await PUT(
			new Request("http://localhost/api/assignment/upload?token=forged-other-assignment", {
				method: "PUT",
			}),
		);

		expect(response.status).toBe(403);
		expect(canAcceptLocalAssignmentUpload).not.toHaveBeenCalled();
		expect(db.assignmentUploadIntent.findFirst).not.toHaveBeenCalled();
		expect(recordLocalAssignmentUpload).not.toHaveBeenCalled();
	});
});
