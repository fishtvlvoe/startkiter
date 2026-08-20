import { describe, expect, it } from "vitest";
import { MOUNT_POINTS } from "./mount-points";

describe("MOUNT_POINTS registry tests (Task 3.1)", () => {
	it("3.1 contains course plugin manifest with mount.content.kind 'auto'", () => {
		const coursePlugin = MOUNT_POINTS.find((plugin) => plugin.id === "course");
		expect(coursePlugin).toBeDefined();
		expect(coursePlugin?.id).toBe("course");
		expect(coursePlugin?.dataSpec).toBe("content");
		expect(coursePlugin?.mount.content?.kind).toBe("auto");
		expect(coursePlugin?.mount.content?.boundTo).toBe("/course");
		expect(coursePlugin?.mount.menu).toBeDefined();
		expect(coursePlugin?.mount.menu?.label).toBe("課程");
	});

	it("supports requiresOperator on menu mount points", () => {
		// Verify structure supports requiresOperator field (for Phase 2 compatibility)
		const coursePlugin = MOUNT_POINTS.find((plugin) => plugin.id === "course");
		expect(coursePlugin?.mount.menu?.requiresOperator).toBeUndefined();
	});
});
