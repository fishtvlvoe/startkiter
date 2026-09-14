## Context

Six SRs (`admin-role-full-access-bypass`, `admin-nav-orphan-pages-wireup`, `buyer-bundle-checkout-entry`, `startkiter-ui-polish-bugs`, `ai-chatbot-frontend-wireup`, `ai-chatbot-provider-model-config`) merged independently, each verified only its own scope. No integrated walkthrough has run since. The bug set this change will fix is unknown until the audit runs — this design covers the process, not a fixed list of fixes.

## Goals / Non-Goals

**Goals:**
- One structured findings report covering every page/flow listed in the proposal, produced by Agy via ego-browser against the live production site.
- Every finding triaged to a resolution: fixed (with commit reference) or explicitly dismissed with reasoning — nothing left unaddressed silently.

**Non-Goals:**
- See proposal Non-Goals (no real payment execution, no destructive member-data operations, no unrequested test data creation).
- Not a general refactor pass — only confirmed bugs get fixed.

## Decisions

### Two-phase process, not a single monolithic task
Phase 1 (audit) produces a findings document. Phase 2 (fix) is a triage loop over that document. This is a process/tooling change, so the two phases are `no-spec` tasks with explicit deliverables (a file, and a resolved-status on every entry in it) rather than a fixed list of code changes, because the code changes are not knowable until Phase 1 completes.

### Findings report format is fixed so Phase 2 can consume it mechanically
Each entry: page/flow name, viewport (desktop/mobile), status (正常/異常), and for 異常 entries — screenshot path, console errors, failed network requests. This lets whoever runs Phase 2 (PM or a dispatched CLI) walk the list without re-interpreting free-form prose.

### Codex fixes, does not just report
Per proposal: findings handed to Codex are fixed directly (not just written up), following the existing standard implementer+reviewer cross-check flow (a different CLI reviews Codex's fixes, PM re-verifies, per `routing.md`).

## Implementation Contract

**Behavior**: This change produces (a) one findings report artifact under `openspec/changes/site-wide-functional-qa-sweep/findings.md`, and (b) for every entry marked 異常 in that report, either a merged fix commit referenced in the report, or an explicit "not a bug, because X" note.

**Interface / data shape**: `findings.md` structure — one row/section per page-viewport combination from the proposal's coverage list, minimum fields: page, viewport, status, evidence (screenshot path / console error text / network error) when status is 異常.

**Failure modes**: If Agy cannot complete a page (site down, auth failure, etc.), that page is recorded as "未完成" with the blocking reason — not silently skipped and not recorded as 正常.

**Acceptance criteria**: `findings.md` exists and has one entry per listed page × viewport combination (no gaps); every 異常 entry has either a commit hash resolving it or an explicit dismissal note; PM has independently re-verified each claimed fix (re-run relevant tests, or re-check the page via ego-browser) before marking the corresponding task done.

**Scope boundaries**: In scope — the audit itself, and fixing bugs it finds within the pages/flows listed in the proposal. Out of scope — any capability not in that list, any refactor unrelated to a found bug, any change to payment-provider integration behavior beyond what's needed to fix a confirmed bug.

## Risks / Trade-offs

[Unknown bug count/severity at proposal time] -> Cannot size Phase 2 in advance; tasks.md's fix task is a triage loop bounded by "every finding resolved," not a fixed task count. If Phase 1 finds more than ~10 real bugs, PM should pause and report to Fish before continuing into Phase 2 rather than silently absorbing a much larger scope.

[Live production testing risk] -> Mitigated by Non-Goals (read-only browsing, no real payment execution, no destructive data operations); any ambiguous case during the audit stops and asks Fish rather than guessing.

## Migration Plan

No deployment/rollback — this is a QA process. Any code fixes produced follow the existing standard flow (worktree → implement → cross-review → PM verify → merge → deploy) already used for the six prior SRs.

## Open Questions

None — proposal and this design fully bound the process; specific bug content is discovered, not decided here.
