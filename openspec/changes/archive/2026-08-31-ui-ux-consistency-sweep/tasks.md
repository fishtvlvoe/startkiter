# Tasks: ui-ux-consistency-sweep

## Phase 1：截圖盤點（agy + ego-browser）
- [x] 1.1 學員端頁面截圖（課程列表、教室播放頁淺色/深色各一張、CoursePack任務頁、site-agent聊天頁）
- [x] 1.2 後台頁面截圖（admin/course-pack列表+詳情、既有admin設定頁抽樣3-5個）
- [x] 1.3 通用元件截圖（側邊欄一般使用者視角、側邊欄operator視角、user menu dropdown、通知面板）
- [x] 1.4 截圖存檔，附頁面路徑對照清單（20張，見 scratchpad/ui-ux-sweep/screenshot-index.md）

## Phase 2：一致性審查（網頁設計師 subagent）
- [x] 2.1 網頁設計師審查全部截圖，比對design token使用、深色模式跟隨、間距字級一致性
- [x] 2.2 產出問題清單（phase2-review.md）；PM 交叉驗證發現子代理原判2個Critical是截圖流程失誤造成的誤判（深色模式其實正常、學員權限其實正確），已訂正報告，真正Critical只有1個（quiz-admin/review-admin/assignment-admin缺app shell）

## Phase 3：修復
- [x] 3.1 依清單逐項修復（Critical優先）—— (operator) route group 補上 AppWrapper layout.tsx
- [x] 3.2 已知的3個問題一併排入：教室頁深色模式強制（PM複驗確認早已修復無回歸）、側邊欄選單分區（PM複驗確認正確無外洩）、**課程模組選單整合成單一一級入口+子導覽**（已完成，方案A巢狀展開）
- [x] 3.3 課程選單整合：網頁設計師判斷採方案A（側邊欄巢狀展開，複用NavMenuList既有subItems邏輯），cursor-agent實作，8個子功能（課程管理/測驗管理/評價與留言管理/作業管理/課程綁定包/新生問卷/媒體庫/CoursePack任務）收攏成「課程」父項，原路徑全部保留，isOperator權限判斷不受影響
- [x] 3.4 修復後PM親自用ego-browser重新截圖驗證（非網頁設計師二次確認，PM直接驗證更直接）
- [x] 3.5 PM 跑完整測試(328/328)+type-check(28/28)全綠，親自建operator測試帳號登入點過quiz-admin(確認有shell)/admin/media(確認課程父項高亮)/課程選單展開(確認8個子項目都在且可點)
- [x] 3.6 更新 `docs/buyer-extension-convention.md`：補上「側邊欄選單掛載（MOUNT_POINTS）」章節，說明一級入口註冊、groupId分組收攏、requiresOperator權限顯示規則，用課程模組整合後的實際代碼（`packages/platform/src/mount-points.ts`、`nav-menu-items.ts`）當範例

**額外發現並修復（不在原計畫但屬同根因）**：side欄grouped-nav模式（拖曳自訂分組）的isActive判斷讀取stale prop，改用usePathname()即時計算+longest-prefix-wins邏輯，順帶修好admin/media、admin/email-settings選中無高亮的問題。

**Merge**: commit `0633d9f4`（main分支head），git show HEAD確認8個檔案的代碼真實存在、328測試+28 type-check全綠，已push。
