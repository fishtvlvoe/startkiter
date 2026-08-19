export type Timecode = number | string;

function invalidTimecode(value: Timecode) {
	throw new Error("Invalid timecode: " + String(value));
}

/** Converts a non-negative integer second value, MM:SS, or HH:MM:SS to seconds. */
export function parseTimecode(timecode: Timecode): number {
	if (typeof timecode === "number") {
		if (!Number.isInteger(timecode) || timecode < 0) {
			invalidTimecode(timecode);
		}
		return timecode;
	}

	const value = timecode.trim();
	if (!value || !/^\d+(?::\d+){0,2}$/.test(value)) {
		invalidTimecode(timecode);
	}
	const parts = value.split(":").map(Number);
	if (
		parts.some((part) => !Number.isInteger(part) || part < 0) ||
		(parts.length > 1 && (parts[parts.length - 1] ?? 0) >= 60) ||
		(parts.length > 2 && (parts[parts.length - 2] ?? 0) >= 60)
	) {
		invalidTimecode(timecode);
	}
	if (parts.length === 1) {
		return parts[0] ?? 0;
	}
	if (parts.length === 2) {
		return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
	}
	return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
}

export function validateTimelineRange({
	at,
	durationSeconds,
	end,
}: {
	at: Timecode;
	durationSeconds?: number;
	end?: Timecode;
}) {
	const startSeconds = parseTimecode(at);
	const endSeconds = end === undefined ? undefined : parseTimecode(end);
	if (endSeconds !== undefined && startSeconds > endSeconds) {
		throw new Error("Timeline end must be greater than or equal to its start");
	}
	if (
		durationSeconds !== undefined &&
		(!Number.isInteger(durationSeconds) || durationSeconds <= 0 || startSeconds > durationSeconds || (endSeconds !== undefined && endSeconds > durationSeconds))
	) {
		throw new Error("Timeline timecode exceeds the verified video duration");
	}
	return { endSeconds, startSeconds };
}
