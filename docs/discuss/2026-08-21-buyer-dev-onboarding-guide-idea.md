# 構想筆記：買家開發引導指南（「遊戲引擎」比喻）

> 狀態：構想，尚未收斂成 change proposal。老闆 2026-08-21 提出，先記錄。

## 一句話

StartKiter 這包代碼是「引擎」，買家是「拿引擎做東西的人」。現在只有給買家 AI 工具看的技術規則（`docs/buyer-extension-convention.md`），沒有給**人**看的「怎麼開發」引導。

## 問題

買家（目標客群：不懂程式的小白）拿到代碼包後，想加一個功能、改一個頁面，卡在：

- 不知道要跟自己的 AI 工具（Claude Code / Cursor）講什麼
- 不知道有哪些步驟（開分支？裝套件？跑測試？）
- 卡住了不知道去哪查、怎麼問

## 現有素材 vs 缺口

| 已有 | 缺口 |
|---|---|
| `docs/buyer-extension-convention.md` — 給 AI 看的技術規則（package.json 形狀、目錄結構） | 給**人**看的教學：情境化、有步驟、有範例對話 |
| Marketplace 模版的 `aiPromptHint` 欄位 — 一段可貼給 AI 的提示文字 | 更完整的「引導手冊」，涵蓋多種常見開發情境，不只是套模版 |
| `docs/deploy-and-public-url.md` — 部署流程 | 「開發」跟「部署」是連續的，目前只有部署那段講清楚 |

## 可能的形式（未決定）

1. **文件型**：一份 `docs/buyer-guide/` 教學，情境式章節（「我想加一個電子報訂閱功能」→ 照抄的 prompt 範例 + 預期結果）
2. **Skill 型**：包成一個買家可以在自己的 Claude Code 裡叫用的 Skill，觸發詞類似「用 StartKiter 慣例加一個 X 功能」，Skill 內建 buyer-extension-convention 規則 + 常見情境範本
3. **混合**：文件是主體，Skill 是文件的「可執行版」，兩者互相參照

游戲引擎產業的參考類比：Unity/Unreal 的「新手教學 + Asset Store + 官方範例專案」組合，不是單一一份規格文件。

## 跟現有 change 的關係

- 不屬於 `platform-shell-plugin-architecture` 範圍（那張管 Shell/Marketplace/買家倉庫拓樸，不管買家怎麼學開發）
- 跟已拆分出去的「課程管理後台編輯器」「Posts/Pages CMS」不同——那兩個是 StartKiter 官方要蓋的後台功能，這個是**買家自己開發的引導教材**
- 可能要等 `buyer-repo-upstream-sync`、模版機制都落地後，引導教材才有實際內容可以寫（先有東西可以教，才能寫教學）

## 待老闆裁決

- 要哪種形式（文件/Skill/混合）？
- 現在就開新 change 規劃，還是等 Phase 8/9 落地後再回頭做？

## 補充（2026-08-21 同日）

`docs/startkiter-development-sop.md` 已寫成——這是「StartKiter 團隊自己怎麼開 SR」的 SOP，內含一份給買家的簡化版四步驟。這份 SOP 是本筆記提到的「StartKiter Agent」構想的核心內容來源之一，兩份筆記互相參照，之後真的要包成 Skill 時，主要素材從 SOP 那份文件搬。
