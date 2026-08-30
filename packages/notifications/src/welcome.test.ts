import { beforeEach, describe, expect, it, vi } from "vitest";

const { createNotification } = vi.hoisted(() => ({
	createNotification: vi.fn(),
}));

vi.mock("./create-notification", () => ({
	createNotification,
}));

import { NOTIFICATION_TYPES } from "./types";
import { createWelcomeNotification } from "./welcome";

describe("createWelcomeNotification", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		createNotification.mockResolvedValue({
			id: "welcome-1",
			userId: "user-new",
			type: NOTIFICATION_TYPES.WELCOME,
		});
	});

	it("creates a WELCOME notification for a newly registered user", async () => {
		await createWelcomeNotification("user-new");

		expect(createNotification).toHaveBeenCalledTimes(1);
		expect(createNotification).toHaveBeenCalledWith({
			userId: "user-new",
			type: NOTIFICATION_TYPES.WELCOME,
			data: {
				title: "Welcome!",
				message: "This is an example notification.",
			},
			link: "/",
		});
	});

	it("does not dedupe a second call at this layer", async () => {
		await createWelcomeNotification("user-new");
		await createWelcomeNotification("user-new");

		expect(createNotification).toHaveBeenCalledTimes(2);
	});
});
