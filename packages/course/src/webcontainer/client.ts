import type { WebContainer as WebContainerInstance } from "@webcontainer/api";

let webContainerPromise: Promise<WebContainerInstance> | null = null;

export function getWebContainer(): Promise<WebContainerInstance> {
	if (!webContainerPromise) {
		webContainerPromise = import("@webcontainer/api")
			.then(({ WebContainer }) => WebContainer.boot())
			.catch((error) => {
				webContainerPromise = null;
				throw error;
			});
	}

	return webContainerPromise;
}

export function resetWebContainerCache() {
	webContainerPromise = null;
}
