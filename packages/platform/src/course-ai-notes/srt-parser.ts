const TIMESTAMP_LINE = /^\s*\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}(?:\s+.*)?\s*$/;

export function srtToText(raw: string): string {
	return raw
		.replace(/\r\n?/g, "\n")
		.split("\n")
		.filter((line) => {
			const trimmed = line.trim();
			return trimmed !== "" && !/^\d+$/.test(trimmed) && !TIMESTAMP_LINE.test(trimmed);
		})
		.map((line) => line.trim())
		.join("\n");
}
