type SearchTokenizer = {
	language: string;
	normalizationCache: Map<string, string>;
	tokenize: (raw: string, language?: string, prop?: string, withCache?: boolean) => string[];
};

const TOKEN_PATTERN =
	/[A-Za-z0-9_]+|[\u3400-\u9fff\uf900-\ufaff\u{20000}-\u{2ffff}]/gu;

const normalizeToken = (
	token: string,
	cache: Map<string, string>,
	withCache: boolean,
) => {
	if (withCache && cache.has(token)) return cache.get(token)!;

	const normalized = token.normalize("NFKC").toLocaleLowerCase("en-US");
	if (withCache) cache.set(token, normalized);
	return normalized;
};

export const multilingualSearchTokenizer: SearchTokenizer = {
	language: "english",
	normalizationCache: new Map(),
	tokenize(raw, _language, _prop, withCache = true) {
		return (raw.match(TOKEN_PATTERN) ?? []).map((token) =>
			normalizeToken(token, this.normalizationCache, withCache),
		);
	},
};
