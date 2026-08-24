import { after } from "next/server";

export function scheduleAfterResponse(task: () => Promise<void>): void {
	try {
		after(task);
	} catch {
		void task().catch(() => undefined);
	}
}
