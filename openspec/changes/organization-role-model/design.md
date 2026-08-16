## Context

StartKiter 之前的 `v1-scope-boundary` spec 明確排除 Organization 多租戶（「不做 Organization / Member / Invitation；帳單掛 user」）。老闆今天重新裁決：StartKiter 自己的網站（賣課那個 app）跟賣給買家的代碼包，本來就是同一套模組（dogfooding），所以要有多租戶架構。

今天已實測比對兩個唯讀來源（路徑已因 code/ 資料夾搬遷更新，且已加入 .gitignore 排除）：
- `code/supastarter-nextjs-main/packages/database/prisma/schema.prisma`（第 141-186 行）：有 Organization/Member/Invitation 表，Member.role 是字串，角色順序定義在 `packages/auth/lib/organization-member-role-order.ts`：`member → admin → owner` 三層，沒有「講師」概念
- `code/realms-course-platform-v1.8.0/prisma/schema.prisma`（第 14-19 行）：UserRole enum 是 `USER / INSTRUCTOR / EDITOR / ADMIN`，全站扁平角色，沒有 Organization/Member/Invitation 表

兩邊都沒有老闆要的角色結構——這是新設計，不是單純抽取。

## Goals / Non-Goals

**Goals:**

- 定義一套合併 supastarter 多租戶機制與 realms 講師語彙的角色矩陣：owner／admin／instructor／user
- 定義「admin 指派/撤銷組織成員為 instructor」這個動作的權限規則
- 把「Organization 不能做」的舊規則正式移除，改為要求支援

**Non-Goals:**

- 不畫 UI、不寫前端元件
- 不接資料庫 migration、不改 `apps/saas`／`packages/auth` 任何程式碼
- 不決定 Invitation 通知機制用 email 還是 LINE（Open Question）
- 不決定買家付費權益掛在 Organization 還是 Member 層級（Open Question，`mvp-offer` 現有規則本次不動）
- 不決定 StartKiter 自己的站要不要真的開放建立多個 Organization（Open Question）

## Decisions

### 角色矩陣：合併 supastarter 的三層跟 realms 的講師語彙，不是照搬任一邊

新角色矩陣定四個角色：`owner`、`admin`、`instructor`、`user`。`owner`／`admin` 沿用 supastarter 既有的組織管理權限語意（owner 可移交組織、admin 可管理成員），`instructor` 語意抽自 realms 的 `INSTRUCTOR`（課程與內容管理權限），`user` 對應 realms 的 `USER`（一般學員）。`instructor` 不是獨立於 Member 角色之外的東西，而是 Member 角色列舉裡的一個值，與 `owner`／`admin`／`user` 同層級（不是「疊加」在 user 之上的旗標）。

- **Alternatives Considered**：
  1. 把「講師」做成一個獨立於 role 之外的 boolean 旗標（`isInstructor`），疊加在任何角色上 — 否決，老闆的描述是「admin 可以指派某人變成講師」，這是身份轉換，用角色列舉值比布林旗標更準確表達「這是這個人在組織裡的身份」，且跟 realms 原本的 enum 設計精神一致
  2. 完全比照 realms 原樣的 `USER/INSTRUCTOR/EDITOR/ADMIN`，不引入 supastarter 的 Organization 概念，只在單一站台內用扁平角色 — 否決，不滿足老闆「StartKiter 自己的站要跟買家拿到的模組一樣，本質上要多租戶」的裁決

### 權限矩陣

| 動作 | owner | admin | instructor | user |
|---|---|---|---|---|
| 移交/刪除組織 | ✅ | ❌ | ❌ | ❌ |
| 新增/移除組織成員（邀請、踢出） | ✅ | ✅ | ❌ | ❌ |
| 指派/撤銷某成員為 instructor | ✅ | ✅ | ❌ | ❌ |
| 建立/編輯課程內容 | ✅ | ✅ | ✅ | ❌ |
| 查看組織內全部訂單/買家名單 | ✅ | ✅ | ❌ | ❌ |
| 查看自己已購課程並觀看 | ✅ | ✅ | ✅ | ✅ |

- **Alternatives Considered**：
  1. 讓 instructor 也能看到組織內全部訂單/買家名單 — 否決，老闆的描述裡 instructor 的職責是「課程與內容管理」，沒有提到金流/買家名單的查看權限，比照 realms 原本 INSTRUCTOR 只管內容不管金流的設計，避免權限過寬
  2. owner 跟 admin 權限完全相同，不做區分 — 否決，supastarter 原本就把 owner 獨立出來（可移交/刪除組織），這是防呆設計（避免多個 admin 互相刪除組織），沿用比自創更安全

### instructor 指派規則

Admin 或 owner 可以把任何現有的組織成員（原本是 `user` 角色）的 role 改成 `instructor`，也可以撤銷（改回 `user`）。Instructor 本人不能自己指派自己，也不能指派別人。一個組織可以有零個、一個或多個 instructor，沒有數量上限。

#### Scenario 對應（供後續 spec 使用）

- admin 把一個 `user` 角色的 member 改成 `instructor` → 允許
- `instructor` 嘗試把自己或別人改成 `instructor` → 拒絕（權限不足）
- `user` 嘗試把自己改成 `instructor` → 拒絕（權限不足）

## Implementation Contract

**Behavior**：本 change 不涉及可執行行為（純規格），此段落定義後續實作 change 必須滿足的行為契約：
- 組織內的 Member 角色 SHALL 是 `owner`／`admin`／`instructor`／`user` 四選一，不得為其他字串值
- 每個 Organization SHALL 恰好有一個 `owner`，移交 owner 身份時舊 owner 的角色 SHALL 自動降為 `admin`
- 指派/撤銷 instructor 身份 SHALL 只能由該組織的 `owner` 或 `admin` 執行，`instructor` 與 `user` 執行時 SHALL 被拒絕

**Interface / 資料形狀**：留給後續後端 change 定義實際的 Prisma schema／API procedure，本 change 只規定角色列舉值與權限矩陣的內容必須與上述表格一致

**Failure modes**：留給後續後端 change 定義

**Acceptance criteria**：本 change 的驗收是文件審查——老闆對角色矩陣表與 instructor 指派規則明確回覆確認，而非程式碼測試

**Scope boundaries**：In scope：角色矩陣定義、instructor 指派權限規則、v1-scope-boundary 規則修訂。Out of scope：UI、資料庫 migration、任何 `apps/saas`／`packages/auth` 程式碼異動

## Risks / Trade-offs

- [Risk] 角色矩陣定案後，若買家付費權益（courseAccess/kitClaimEligible）掛在 Organization 或 Member 的決定跟這份角色矩陣衝突，會需要回頭修改本 change 的角色定義 → Mitigation：Open Questions 明確列出這個依賴，後續 change 處理買家權益歸屬時必須先讀本 change 的角色矩陣，不得繞過
- [Risk] StartKiter 自己的網站要不要真的支援多組織，若答案是「否，永遠一個組織」，這份角色矩陣裡的部分規則（如「移交組織」）會變成用不到的過度設計 → Mitigation：Open Questions 已列出這題，待老闆裁決後，若答案是單一組織，後續 change 再簡化，本 change 的角色矩陣本身仍然成立（單組織是多組織的特例，不衝突）

## Migration Plan

本 change 不涉及部署或資料庫變更（純規格文件），無需 Migration Plan。

## Open Questions

- StartKiter 自己的網站要不要真的開放建立多個 Organization，還是永遠只用一個官方組織？
- 買家付費權益（courseAccess／kitClaimEligible）掛在 Organization 層級（整組織買一次全員可用）還是 Member 層級（每人各自付費）？
- Invitation 通知機制要不要沿用 supastarter 現有的 email 機制，還是配合 StartKiter 既有的 LINE／email 客服模式重新設計？
