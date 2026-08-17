# PAYUNi Checkout Scenario 驗證

驗證日期：2026-08-18

本機 `.env` 未設定任何 `PAYUNI_*` 金鑰；因此未呼叫 PAYUNi 外部服務。所有加密、gateway 與 webhook 案例使用 PAYUNi sandbox URL 的固定測試憑證，route 則另外驗證缺設定時 fail-closed。

## Scenario 結果

| Scenario | 結果 | 證據 |
| --- | --- | --- |
| Checkout uses PAYUNi；SKU 固定 `startkiter-mvp`、金額 8800 TWD | PASS | `checkout.test.ts`；固定 sandbox fixture 建立 `form_post` session，order amount/currency/sku 皆符合契約 |
| Unconfigured PAYUNi fails closed | PASS | `session-failclosed.test.ts` 回傳 503 非 500；ego-browser 登入後 POST `/api/checkout` 回傳 `503 {"error":"payuni_not_configured"}` |
| Client alternate SKU rejected | PASS | `checkout.test.ts`；ego-browser 登入後 POST `/api/checkout` body `{"sku":"other-sku"}` 回傳 `400 {"error":"invalid_sku"}` |
| First successful notify marks order paid | PASS | `notify.test.ts` 驗證 status=paid、`courseAccess=true`、`kitClaimEligible=true` |
| Duplicate notify is idempotent | PASS | `notify.test.ts` 驗證第二次通知回 200、order 數量仍為 1、entitlement flags 不重複變更 |
| Invalid notify rejected | PASS | `notify.test.ts` 驗證錯誤簽章回 400 且 order 保持 pending |
| Refunded order loses kit eligibility | PASS | `refund.test.ts` 驗證 status=refunded 且 `courseAccess=false`、`kitClaimEligible=false` |
| Refunded eligibility durable for later claim | PASS | `refund.test.ts` 驗證退款後持久旗標維持 false，且 refund helper 不呼叫 GitHub API |

## 指令結果

```text
pnpm --filter @startkiter/payments exec vitest run \
  packages/payments/checkout.test.ts packages/payments/credentials.test.ts \
  packages/payments/crypto.test.ts packages/payments/factory.test.ts \
  packages/payments/notify.test.ts packages/payments/order.test.ts \
  packages/payments/refund.test.ts packages/payments/session-failclosed.test.ts

Test Files  8 passed (8)
Tests       22 passed (22)
```

PAYUNi production credentials 未接入；正式金流上線前仍需填入 sandbox/test credentials 並重新做外部 sandbox smoke test。
