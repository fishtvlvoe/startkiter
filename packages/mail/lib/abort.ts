/** AbortSignal 已觸發時立刻 reject；否則與 promise 競速。 */
export function rejectWhenAborted<T>(
	promise: Promise<T>,
	signal?: AbortSignal,
): Promise<T> {
	if (!signal) {
		return promise;
	}

	if (signal.aborted) {
		return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
	}

	return new Promise<T>((resolve, reject) => {
		const onAbort = () => {
			reject(new DOMException("The operation was aborted.", "AbortError"));
		};

		signal.addEventListener("abort", onAbort, { once: true });

		promise.then(
			(value) => {
				signal.removeEventListener("abort", onAbort);
				resolve(value);
			},
			(error) => {
				signal.removeEventListener("abort", onAbort);
				reject(error);
			},
		);
	});
}
