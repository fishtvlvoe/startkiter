# Codex CR 報告：auto-allowance-on-cross-month-refund

日期：2026-09-03
審查工具：`codex exec review --uncommitted`（實作方以外）
原始輸出：`/tmp/auto-allowance-codex-cr.txt`

## 初審 finding（Codex）

| 等級 | 議題 | 處置 |
|---|---|---|
| P1 | stale void marker 跨月會落入自動折讓 | 已修：stale `VOID_*`／`REFUND_IN_PROGRESS` 跨月改標 `REFUND_NEEDS_ALLOWANCE`，不走自動折讓 |
| P1 | status=`ALLOWANCE` 的部分折讓發票進不了退款折讓 | 已修：退款受理 `ISSUED`／`ALLOWANCE`；訂閱查詢同步 |
| P1 | reserve 未先佔租約，與 admin 有空窗 | 已修：reserve 先寫 `ALLOWANCE_IN_PROGRESS` + token；runner 以 `resumeOperationToken` 續跑 |
| P1 | ecpay／ezpay allowance catch 一律 `ambiguous: true` | **已還原／不作此改**：折讓逾時必須 ambiguous，否則 FAILED 可被重試造成雙重折讓（PM 退回）。另補 1.11 回歸測 |
| P2 | recoverStaleAllowance 清掉 system trigger | 已修：成功回收時保留 `[trigger:system:...]` |
| P2 | smoke 腳本未打真路徑 | 保留契約數字腳本；行為證據改以 vitest 矩陣 + `/tmp/auto-allowance-cross-month-vitest-evidence.txt` |

## 複核

- `pnpm --filter @startkiter/api test` → 266 passed
- `pnpm --filter @startkiter/api type-check` → exit 0
- 新增回歸：stale void 跨月、status=ALLOWANCE 剩餘折讓

## Critical

Critical: 0

VERDICT: PASS（P1 已修完並複測）
