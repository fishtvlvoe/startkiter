▋ 1.1 markOrderPaid／gatewayTradeNo 併發防護盤點

• 呼叫鏈：`POST /api/payuni/notify`（`apps/saas/app/api/payuni/notify/route.ts`）→ `decidePayuniNotify`（`packages/payments/notify.ts`）→ `markOrderPaid(orderId, orderNo, tradeNo)`（`apps/saas/lib/orders.ts`）。`TradeNo` 來自 PAYUNi payload，不是本機預先產生；訂閱路徑另有 `generateGatewayTradeNo()`（`packages/api/modules/course/procedures/create-subscription-checkout.ts`），一次買斷 notify 不走那條。

• 現行防護：`markOrderPaid` 包在 `withOrderStateLock`（`packages/api/modules/course/lib/order-refunds.ts`）裡，用 Postgres `pg_advisory_xact_lock` 對單一 `orderId` 序列化，再 `updateMany({ where: { status: "pending" }, data: { status: "paid", gatewayTradeNo, ... } })`。這是「條件更新」不是先讀後寫的 check-then-write；同單在鎖有效時第二次會拿到 `count=0`，route 再查已 paid 回 200。

• Schema：`Order.gatewayTradeNo String? @unique`（`packages/database/prisma/schema.prisma` Order model）。唯一約束擋的是「不同列寫入同一個 trade no」，不是同列重複更新。

• 缺的那一層：`markOrderPaid`／notify route 都沒捕捉 Prisma `P2002`（UniqueConstraintViolation）。併發下只要 `updateMany` 撞到已存在的 `gatewayTradeNo`，錯誤會直接冒成 HTTP 500，而不是當成冪等成功。

• 壓測 4/50 觸發路徑：`/tmp/sk-stress-test/forge-notify.js` 用 `STRESS${Date.now()}${idx}`.slice(0, 20) 當假 TradeNo。`STRESS`(6) + 13 位毫秒時間戳後，兩位數 idx 常被截掉，不同訂單在同一毫秒窗會寫出相同 `gatewayTradeNo` → 第二筆 `updateMany` 撞 `@unique` → UniqueConstraintViolation 500。同單 advisory lock 擋得了重複入帳，擋不了「跨單 trade no 碰撞」也沒把 P2002 收成冪等／可重試語意。
