## Context

前四張 change 各自都有分層驗收，但每一張的驗收範圍都刻意限定在自己的骨架邊界內（例如 `role-based-workspace-navigation` 只驗三種角色標籤的骨架，不驗全部語言與主題組合；`account-settings-theme-language` 只驗基礎主題語言組合，不驗跨 App）。沒有一張 change 負責「把四張都完成後，整個平台實際上線前」這件事——這正是 `completion.md` 與 `docs/ux/startkiter-sr-architecture-focus.html` 都強調的：自動檢查通過不代表完成，還要實際操作不同角色、語言、主題與手機畫面，且要留下紀錄。

## Design Source

- Source: `docs/ux/startkiter-sr-architecture-focus.html`「完成標準」「每張 SR 都要留下這些證據」段落：範圍清楚、每個 App 有自己的範圍、角色不越界、自動檢查、實際操作、有紀錄。
- 對焦重點：「沒有這些證據，只能說完成規劃，不能說功能完成」。

## Goals / Non-Goals

**Goals:**

- 定義上線前必須覆蓋的完整驗收矩陣（角色 × 主題 × 語言 × 裝置）。
- 定義「所有可見按鈕與連結」逐一驗收的具體判定標準（有預期結果、無裸露錯誤、無死連結）。
- 定義錯誤狀況驗收範圍（未授權路由、無效輸入、逾時）。
- 定義部署後瀏覽器驗證與回滾排練的固定流程。
- 定義交付證據的格式，讓「完成」有可核對的紀錄而非口頭回報。

**Non-Goals:**

- 不重新驗證前四張 change 各自的骨架邏輯是否正確實作——假設它們已各自通過分層驗收，本 change 驗的是整合後的實際行為。
- 不建立新的監控或告警基礎設施。
- 不涵蓋課程等各 App 的內容教學品質。

## Decisions

### The verification matrix is the product of role, theme, locale, and device, not a spot check

驗收矩陣 = 3 種角色（使用者、App 管理員、總管理員）× 2 種主題（dark、light；system 模式在 `account-settings-theme-language` 已驗，本次以 dark／light 為主要覆蓋）× 3 種語言（zh-tw、zh-cn、en）× 2 種裝置寬度（`1440px`、`390px`）＝ 36 種組合。每個已上線 App 至少要在這 36 種組合中各跑過一次核心路徑（進入首頁、開啟一級選單、開啟帳號選單），不是只驗其中幾種代表性組合。

**Alternatives Considered:**

- 只驗「代表性」幾種組合（例如只驗 zh-tw + dark + 桌機）：否決，正是過去「demo 看起來對、實際 app 跑掉」的成因——語系混用、主題殘留這類問題通常只在特定組合下才出現。

### Every visible button and link must have a defined expected outcome

驗收時，對每個目前角色能看到的按鈕與連結，事先定義預期結果（導向哪個頁面、或應該出現什麼樣的權限拒絕），不是點了看畫面「感覺對不對」。凡是點擊後出現未預期的 401/500、空白頁、或按鈕完全無反應，都算驗收失敗。

**Alternatives Considered:**

- 只驗「主要功能路徑」，忽略次要按鈕（例如「幫助」「升級」）：否決，`app-feature-surfaces`、`role-based-workspace-navigation` 都已把這些入口固定進帳號選單，若不驗證就無法保證骨架契約真的落地。

### Rollback is rehearsed, not merely documented

回到上一版的方法必須實際排練過一次（在 TEST／preview 環境執行一次真的回滾），並記錄排練結果；只寫一份文件說「理論上可以回滾」不算完成。

**Alternatives Considered:**

- 只在文件上描述回滾步驟，不實際執行：否決，`role-based-workspace-navigation`／`app-feature-surfaces` 的 Migration Plan 都假設「回滾到 adapter 仍存在的 commit」可行，若沒有實際排練過，無法確認這個假設成立。

### Delivery evidence has a fixed format: done, confirmed, and still unconfirmed

每次上線前確認的交付紀錄必須包含三個欄位：做了什麼（範圍）、確認了什麼（附截圖或測試輸出路徑）、還有哪些地方尚未確認（明確列出，不得留白假裝沒有）。這對應 `~/.agent-guardrails/completion.md` 的回報格式，本 change 把它固定成本產品專用的驗收紀錄模板。

**Alternatives Considered:**

- 只留一句「上線前確認已完成」的結論：否決，無法讓下一個人（人類或 AI）知道哪些組合真的驗過、哪些只是假設沒出問題。

## Implementation Contract

### Observable behavior

- 每次上線前確認會產出一份對照 36 種組合的紀錄表，逐格標記「已驗證」「不適用」或「未驗證」，不得整份留白。
- 每個目前角色可見的按鈕與連結都有一筆「預期結果 vs 實際結果」紀錄。
- 錯誤狀況驗收（未授權路由、無效輸入、逾時）各自有明確的預期畫面描述與實測結果。
- 部署後瀏覽器驗證使用實際部署網址，不使用本機開發伺服器。
- 回滾排練有一次實際執行紀錄（時間戳、執行指令、回滾後健康檢查結果）。

### Interface and data shape

```ts
type VerificationCell = {
  role: "app-user" | "app-admin" | "super-admin";
  theme: "dark" | "light";
  locale: "zh-tw" | "zh-cn" | "en";
  viewport: "1440" | "390";
  status: "verified" | "not-applicable" | "unverified";
  evidencePath?: string; // 截圖或測試輸出路徑
};

type LinkVerification = {
  appId: string | "platform";
  entryId: string;
  expectedOutcome: string;
  actualOutcome: string;
  passed: boolean;
};

type LaunchEvidenceReport = {
  changeId: string;
  matrix: VerificationCell[]; // 長度必須等於 36（或列出 not-applicable 的理由）
  linkChecks: LinkVerification[];
  errorScenarios: Array<{ scenario: string; expected: string; actual: string; passed: boolean }>;
  rollbackRehearsal: { executedAt: string; command: string; healthCheckResult: string } | null;
  unresolvedItems: string[]; // 明確列出尚未確認的項目，允許為空陣列但不得省略欄位
};
```

### Failure behavior

- `matrix` 陣列缺少任一組合、或某格狀態為空：驗收報告產生器拒絕輸出，列出缺少的組合。
- `linkChecks` 中任一筆 `passed: false`：整份上線前確認視為未通過，不得標記「完成」。
- `rollbackRehearsal` 為 `null`：上線前確認視為未通過。
- `unresolvedItems` 欄位缺失（而非空陣列）：驗收報告產生器拒絕輸出。

### Acceptance criteria

- 完整跑過一次 36 組合矩陣，`matrix` 每格皆為 `verified` 或附合理的 `not-applicable` 理由（不得只是「未驗證」留白）。
- 目前角色可見的每個按鈕與連結都有 `LinkVerification` 紀錄，且全數 `passed: true`。
- 錯誤狀況（至少涵蓋：未授權路由直接請求、表單無效輸入、模擬逾時）各自有預期與實際結果紀錄。
- ego-browser 在部署環境（TEST／preview 或正式）完成驗證，並留有截圖或錄影路徑。
- 回滾排練有一次實際執行紀錄，包含健康檢查結果。
- 最終產出一份 `LaunchEvidenceReport`，存放於 `docs/verification/`，`unresolvedItems` 若非空需附上後續處理計畫。

### Scope boundaries

In scope: 驗收矩陣定義、按鈕連結逐一驗收、錯誤狀況驗收、部署後瀏覽器驗證流程、回滾排練、交付證據格式與產出。

Out of scope: 前四張 change 各自骨架邏輯的正確性（假設已各自驗收通過）、任何新產品功能、監控告警基礎設施、課程等 App 的內容教學品質。

## Risks / Trade-offs

- [Risk] 36 組合矩陣執行成本高，可能被壓縮成「意思意思跑幾格」→ Mitigation：`Failure behavior` 明訂矩陣缺格時報告產生器直接拒絕輸出，不能靠人工口頭保證跑完。
- [Risk] 部署環境（Coolify + VPS）目前只有單一伺服器，回滾排練可能影響正在運作的服務 → Mitigation：優先在 TEST／preview 環境排練，正式環境的回滾排練安排在低流量時段並先知會 Fish。
- [Risk] 「所有可見按鈕與連結」範圍隨 App 數量增加而擴大，未來每加一個 App 都要重跑一次完整驗收 → Mitigation：`LaunchEvidenceReport` 以 `appId` 分組，新增 App 時只需針對該 App 新增驗收筆數，不需要重驗已驗證過的舊 App（除非該次上線有觸碰共用元件）。

## Migration Plan

1. 建立 `LaunchEvidenceReport` 的資料結構與報告產生器，先以既有課程 App（`app-feature-surfaces` 完成後）跑一次試產出，確認結構可用。
2. 執行 36 組合矩陣驗收，逐格記錄 `verified`／`not-applicable` 與證據路徑。
3. 逐一驗收目前所有可見按鈕與連結，記錄 `LinkVerification`。
4. 執行錯誤狀況驗收（未授權路由、無效輸入、逾時模擬）。
5. 在 TEST／preview 部署環境執行一次 ego-browser 完整驗證，留存截圖或錄影。
6. 執行一次實際回滾排練並記錄結果。
7. 彙整成 `LaunchEvidenceReport`，存入 `docs/verification/`，`unresolvedItems` 非空時附後續處理計畫並回報 Fish。

## Open Questions

- 目前沒有未解問題。若未來 App 數量增加導致 36 組合矩陣的執行時間超出可接受範圍，需回頭與 Fish 討論是否引入自動化 visual regression 工具，屬於另一個 change 的範圍。
