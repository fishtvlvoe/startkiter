# Proposal: remove-unused-polar-provider

## 問題

`packages/payments/provider/polar/index.ts` 有一個函式 `setSubscriptionSeats` 是 `throw new Error("Not implemented")`。全站盤點（`full-site-audit-2026-08-30.md`）把它列為技術債。

進一步 grep 確認：這份代碼**完全沒有被使用**——`packages/payments/provider/index.ts` 的總 export 清單裡沒有它，全 repo 沒有任何 UI／設定／checkout 流程引用它，唯一提到它的地方是各 spec 的 `@trace` 檔案清單（歷史紀錄，非功能要求）。

而且 `openspec/specs/v1-scope-boundary/spec.md` 早就正式規定：**Polar MUST NOT collect MVP funds**，還有一個「有人提案要用 Polar 收款被 SDD review 正式駁回」的紀錄案例（line 3742-3750）。也就是說這份代碼不只是沒用，還是明文禁止啟用的東西，純粹是殘留的鷹架代碼（可能來自 supastarter 原始模板），不是半成品功能。

## 修法

整個刪除：
- `packages/payments/provider/polar/` 資料夾（`index.ts` 214 行，無對應測試檔）
- `packages/payments/package.json` 的 `@polar-sh/sdk` 依賴
- 跑 `pnpm install` 更新 lockfile

## 不做什麼

- 不改 `v1-scope-boundary` 正式規格（該規格已經正確描述「Polar 不能收 MVP 款」，這次只是讓代碼跟規格一致，不需要新的 delta）
- 不動其他付款 provider（Stripe／Shopline／PAYUNi）
- 不砍其他技術債項目（例如 `PLACEHOLDER_MEDIA`，那是總表第 5 項的另一半，不在這張處理）

## 影響範圍（cross-impact，已 grep 全部呼叫點）

**🔴 需要注意**：無。

**⚠️ 需要處理**：無其他呼叫點需要遷移——這是純刪除，沒有東西要接手它的邏輯。

**✅ 已確認無風險**：
- `packages/payments/provider/index.ts` 的 barrel export 沒有匯出 polar 模組，刪除不影響其匯出介面
- 全 repo grep `polar`／`Polar`（排除 `packages/ui/components/chart.tsx` 裡不相干的 recharts CSS class 名稱）確認除了它自己的檔案跟各 spec 的 `@trace` 歷史紀錄外，沒有其他 runtime 代碼引用
