# Supastarter 參考來源修正（2026-08-17）

## 問題

之前 change（`extract-supastarter-design-system`）參考的三份本機 supastarter 副本：

- `/Users/fishtv/Development/products/startkiter/code/supastarter-nextjs-main`
- `/Users/fishtv/Development/supastarter-nextjs`
- `/Users/fishtv/Development/dev-code/supastarter-nextjs-main`

實測確認：**這三份都不是獨立 git clone**,是巢狀在別的 repo（`startkiter`／`Development`）裡的普通資料夾,沒有自己的 `.git`、沒有 remote、沒有版本歷史。無法得知對應官方哪個版本、是否過時。

## 正確做法（查官方文件 https://supastarter.dev/docs/nextjs/setup 得到)

**官方 GitHub repo**：`https://github.com/supastarter/supastarter-nextjs`——這個 repo 是 **private**,不是公開模板。Fish 的 GitHub 帳號 `fishtvlvoe` 已被官方加進 collaborator 名單,權限是 `pull: true`（可讀取/clone,不能 push),這是「購買授權」實際對應的存取方式,不是 fork。已用 `gh api repos/supastarter/supastarter-nextjs` 實測驗證確實可以直接讀取最新內容（含 `CHANGELOG.md` 可查版本紀錄）。

Fish 自己也整理了 `fishtvlvoe/supastarter-platform`（private,"SaaS 通用底盤"),裡面用 **git submodule** 名叫 `upstream` 引用官方 repo,這是正確的追蹤設定方式,比對照本機不明版本快照要可靠很多。

官方文件另外提到的取得方式（給一般公開情境參考,不是 Fish 這種已授權帳號要用的路徑)：
1. `npx supastarter new my-awesome-project`——CLI 自動 clone + 設定 + 裝依賴 + 建資料庫
2. 手動 clone 後設定 `git remote add upstream` 方便之後拉更新

**授權模式**：commercial license,購買後帳號被加進私有 repo 的 collaborator,可用於無限專案,原始碼不公開,但購買者有完整讀取與修改權限。

**架構**（來自 https://supastarter.dev/docs/nextjs 總覽頁)：monorepo,含 `apps/marketing`、`apps/saas`、`apps/docs`、`apps/mail-preview`,用 Turborepo 管理。文件本身有 `.zip` 全量下載版本可用。

## 修正原則

以後參考 supastarter（或任何外部原始碼)一律用**官方 GitHub repo 連結**查最新版本,不用本機不明版本的快照。這個原則也適用於 StartKiter 交付給客戶的方式——客戶／AI 應該被引導去查公司官方 GitHub repo 取得最新代碼,不是给一份寫死的本機打包快照。

## 已確認

- Fish 已購買 supastarter 授權,GitHub 帳號 `fishtvlvoe` 對 `supastarter/supastarter-nextjs`（private repo）有 `pull` 權限,已用 `gh api` 實測驗證可直接讀取
- 之後查 supastarter 最新程式碼／文件,一律用 `gh api repos/supastarter/supastarter-nextjs/contents/<path>` 或 `git clone`（走 Fish 已登入的 gh 認證)直接查官方 repo,不再用本機那三份不明版本的副本

## 待確認

- 已經合併進 main 的 `extract-supastarter-design-system` change,其設計 token／元件是否對照過官方最新版本——這次不重做,但值得記一筆,未來若要對照升級知道從哪裡查起
