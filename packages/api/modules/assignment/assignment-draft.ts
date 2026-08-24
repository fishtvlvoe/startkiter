export function shouldApplyAssignmentDraftRevision(currentRevision: number, incomingRevision: number): boolean {
	return Number.isInteger(currentRevision) && currentRevision >= 0 && Number.isInteger(incomingRevision) && incomingRevision > currentRevision;
}
