export function parseDurationToSeconds(value: string | null | undefined): number {
	if (!value) {
		return 0;
	}

	const parts = value.split(":").map((part) => Number(part));

	if (parts.some((part) => Number.isNaN(part))) {
		return 0;
	}

	if (parts.length === 3) {
		return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
	}

	if (parts.length === 2) {
		return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
	}

	return parts[0] ?? 0;
}

export function formatTotalDuration(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	if (hours > 0) {
		return `${hours} 小時 ${minutes} 分鐘`;
	}

	return `${minutes} 分鐘`;
}
