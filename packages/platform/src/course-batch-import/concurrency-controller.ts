export async function runWithConcurrency<T, R>(
	items: readonly T[],
	limit: number,
	worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	if (!Number.isInteger(limit) || limit < 1) throw new Error("CONCURRENCY_LIMIT_INVALID");
	const results = new Array<R>(items.length);
	let nextIndex = 0;
	async function consume(): Promise<void> {
		while (true) {
			const index = nextIndex;
			nextIndex += 1;
			if (index >= items.length) return;
			results[index] = await worker(items[index]!, index);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => consume()));
	return results;
}
