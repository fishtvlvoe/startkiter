/**
 * 5.3 跨月退款自動折讓實跑腳本（mock 邏輯對照，不連真 DB／供應商）
 * 輸出：/tmp/auto-allowance-cross-month-smoke.json
 *
 * 真實行為以 vitest refund-invoice 矩陣為準；本腳本鎖定金額／狀態契約數字。
 */
import { writeFileSync } from "node:fs";

function remaining(amount, allowanceTotal) {
	return amount - allowanceTotal;
}

function simulateAutoAllowance(input) {
	const rem = remaining(input.amount, input.allowanceTotal);
	if (rem <= 0) {
		return {
			providerAllowanceCalledWith: null,
			statusAfter: "ISSUED",
			allowanceTotalAfter: input.allowanceTotal,
			attentionReasonAfter: null,
			systemTriggerMarker: null,
		};
	}
	if (!input.providerSucceeds) {
		return {
			providerAllowanceCalledWith: rem,
			statusAfter: "ISSUED",
			allowanceTotalAfter: input.allowanceTotal,
			attentionReasonAfter: input.ambiguous ? "ALLOWANCE_NEEDS_REVIEW" : "REFUND_NEEDS_ALLOWANCE",
			systemTriggerMarker: null,
		};
	}
	return {
		providerAllowanceCalledWith: rem,
		statusAfter: "ALLOWANCE",
		allowanceTotalAfter: input.allowanceTotal + rem,
		attentionReasonAfter: null,
		systemTriggerMarker: "[trigger:system:auto-cross-month-refund]",
	};
}

const scenarios = [
	{
		name: "partial-then-full-auto",
		amount: 8800,
		allowanceTotalBefore: 3000,
		...simulateAutoAllowance({ amount: 8800, allowanceTotal: 3000, providerSucceeds: true }),
	},
	{
		name: "already-fully-credited",
		amount: 8800,
		allowanceTotalBefore: 8800,
		...simulateAutoAllowance({ amount: 8800, allowanceTotal: 8800, providerSucceeds: true }),
	},
	{
		name: "definite-failure-fallback",
		amount: 8800,
		allowanceTotalBefore: 0,
		...simulateAutoAllowance({ amount: 8800, allowanceTotal: 0, providerSucceeds: false }),
	},
].map((row) => ({
	...row,
	ok:
		(row.name === "partial-then-full-auto" &&
			row.providerAllowanceCalledWith === 5800 &&
			row.statusAfter === "ALLOWANCE" &&
			row.allowanceTotalAfter === 8800 &&
			row.attentionReasonAfter === null &&
			row.systemTriggerMarker === "[trigger:system:auto-cross-month-refund]") ||
		(row.name === "already-fully-credited" &&
			row.providerAllowanceCalledWith === null &&
			row.attentionReasonAfter === null) ||
		(row.name === "definite-failure-fallback" &&
			row.attentionReasonAfter === "REFUND_NEEDS_ALLOWANCE"),
}));

const result = {
	ranAt: new Date().toISOString(),
	scenarios,
};

const outPath = "/tmp/auto-allowance-cross-month-smoke.json";
writeFileSync(outPath, JSON.stringify(result, null, 2));
const allOk = scenarios.every((s) => s.ok);
console.log(JSON.stringify({ outPath, allOk, scenarios: scenarios.map((s) => ({ name: s.name, ok: s.ok })) }, null, 2));
if (!allOk) process.exit(1);
