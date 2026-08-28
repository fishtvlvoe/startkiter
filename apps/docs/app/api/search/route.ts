import { createFromSource } from "fumadocs-core/search/server";

import { source } from "@/lib/source";
import { multilingualSearchTokenizer } from "@/lib/search-tokenizer";

export const { GET } = createFromSource(source, {
	tokenizer: multilingualSearchTokenizer,
});
