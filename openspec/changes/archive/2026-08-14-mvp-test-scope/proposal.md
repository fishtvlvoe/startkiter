## Why

repo-foundation 鎖住的 v1（SHOPLINE 先、不是賣課平台、不做 AI 對話）已經跟 2026-08-14 產品對齊結果相反。不先改規格，下一步抽程式會照過期邊界做。

## What Changes

- 修改 openspec/config.yaml 產品定位：改為「課 + 終身代碼包」MVP 測試，主金流改統一金流
- 修改 README.md 與 AGENTS.md：拿掉「不是賣課平台」與「四堂課對 SHOPLINE」的過期句子
- 新增 mvp-offer：單價 NT$8,800、終身代碼更新、課與代碼同一 SKU
- 新增 payuni-checkout：MVP 只接通一金流一次買斷 TWD
- 新增 course-module：課程是網站模組，官網用這包自己賣課
- 新增 github-kit-fulfillment：付款後在站內用 GitHub 登入，API 邀請私人倉庫只讀
- 新增 site-agent：可接 Gemini／OpenAI／Claude；v1 工具僅查自己訂單與課程進度
- 新增 line-learner-community：付費學員在課程裡加入 LINE 交流群；客服走 email，不進這個群；LINE 無法強制入群
- 修改 v1-scope-boundary：**BREAKING** 相對 repo-foundation：主金流改 PAYUNi、保留課程 UI、允許站內 agent、取消四堂對 SHOPLINE 的解鎖順序

## Non-Goals

- 本 change 不抽 supastarter／thetu 應用程式碼，不建立可跑的 Next.js 應用
- 不做 Shopline、Stripe、Polar 收款
- 不做三階定價、月繳、發票（發票下一輪）
- 不把 libon.me 代碼拷進本 repo
- 不實作 agent 除「查訂單、查課程進度」以外的工具
- 不做 SKOOL 類社群平台、不做 LINE Messaging 強制入群
- 不買網域、不 push、不手動邀請 GitHub（那是後續實作 change 的自動化範圍）

## Capabilities

### New Capabilities

- `mvp-offer`: MVP 商品是一價 NT$8,800 的課，附終身代碼包更新
- `payuni-checkout`: 統一金流一次買斷 TWD，未設定必須 fail-closed
- `course-module`: 站內課程觀看；課程是模組不是整站唯一長相
- `github-kit-fulfillment`: 付款成功後站內 GitHub OAuth，邀請組織私人倉庫只讀
- `site-agent`: 對話可接三家模型；v1 只讀自己的訂單與課程進度
- `line-learner-community`: 付費後課程內顯示 LINE 交流群連結；客服信箱另開，不進 LINE 群
- `v1-scope-boundary`: MVP 邊界（PAYUNi、課程模組、agent、抽取白名單）；取代 repo-foundation 尚未 archive 的那版句子

### Modified Capabilities

(none)

## Impact

- Affected specs: mvp-offer, payuni-checkout, course-module, github-kit-fulfillment, site-agent, line-learner-community, v1-scope-boundary
- Affected code:
  - New: (none，本 change 只寫規格與治理文件)
  - Modified: openspec/config.yaml, README.md, AGENTS.md, .docs/COMBINED.md
  - Removed: (none)
- Dependencies 新增: (none)
- 環境變數新增: (none，runtime 金鑰列在後續 extract change)
