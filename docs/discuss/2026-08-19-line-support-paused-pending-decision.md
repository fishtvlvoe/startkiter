---
name: line-support-paused-pending-decision
description: LINE 客服工單通知系統提案，discuss 第一題就撞到 v1 硬邊界，Fish 確認暫緩
type: project
---

# LINE 客服工單通知系統 — 暫緩

**狀態：** 暫緩，不繼續做
**日期：** 2026-08-19

## 提案原文

見 `docs/discuss/2026-08-19-handoff-coolify-implementation-and-line-support.md` 第五節。核心想法：買家網站出問題時，透過網站介面自動通知 StartKiter 團隊（傾向用 LINE），取代現在人工引導「加我們 LINE」的斷點。

## 暫緩原因

Discuss 第一題就發現這個提案會撞到專案現有的 v1 硬性邊界（`openspec/config.yaml`）：

1. **`openspec/config.yaml` 明文：**「LINE Login Channel 做登入；學員社群用課程內 LINE 邀請連結，**不做 Messaging / LIFF / Bot**，不能靜默入群」
2. **`openspec/config.yaml` 明文：**「客服走 email」

白話：現在系統只接通「用 LINE 帳號登入網站」（Login Channel）。要做「工單自動用 LINE 通知」需要另開一個不同的東西（Messaging API / LINE 官方帳號，可以主動發訊息），這條線現在明文禁止；現在的客服管道也寫死是 email，不是 LINE。

新提案不是「多加一個功能」，是要推翻這個專案現有的兩條 v1 硬性規則。

Fish 確認：討論 Coolify 部署架構時沒注意到會撞到這條既有邊界，這個新方向先暫緩，不繼續做。

## 已查過、下次重啟討論可直接用的既有資源

- `docs/discuss/line-login-from-line-hub.md`：確認現在只接 LINE Login Channel，文件明講「v2 才考慮：LIFF、加好友 bot_prompt、Messaging 通知，那是另一個產品，不是登入課」——跟這次撞到的邊界是同一件事，早就標記過是 v2 範圍。
- `packages/notifications`：現有的是**站內通知**（Notification bell，`WELCOME`/`APP_UPDATE` 兩種類型），方向是「系統通知買家」，不是「買家出事通知 StartKiter 團隊」，兩者方向相反，不能直接拿來用，但架構（`create-notification.ts`/`catalog.ts` 的 type 註冊模式）可參考。
- 全域未找到任何 LINE Messaging SDK（`@line/bot-sdk`）或 Telegram 整合痕跡，這塊是純新建。
- `BuyerDeployment` model（工單若要跟部署關聯會用到）目前只存在於未合併的 `coolify-managed-deployment` worktree 分支，main 上還沒有這張表。

## 下次重啟討論前必須先問 Fish 的問題

1. 要不要正式修改 `openspec/config.yaml` 的 v1 邊界，把「不做 Messaging/LIFF/Bot」「客服走 email」改掉？這是前提，沒改掉這個提案無法成立。
2. 如果邊界要改，是否要重新評估 LINE vs Telegram（Fish 原話「比較方便」沒有更細理由，值得展開比較費用/則數限制/開發成本）。
3. 原始提案第五節列的其餘問題（工單存哪裡、AI 怎麼判斷已解決、跟 Coolify 介入能力怎麼串接、介面是浮動客服框還是複用 `/deployment` 頁面）仍然有效，等邊界問題確認後再問。
