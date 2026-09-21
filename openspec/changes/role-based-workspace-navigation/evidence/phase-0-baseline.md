# SR-01 Phase 0 回歸基準

日期：2026-09-22

## 0.1 既有測試基準

執行命令：

```text
pnpm --filter @startkiter/saas test
```

實際結果：

```text
Test Files  106 passed (106)
Tests  430 passed (430)
Duration  9.50s
```

Vite 顯示既有 `configLoader: 'native'` 相容性警告；不影響本次測試 exit 0。這組 106/430 只作為遷移前基準，不作為本 change 的完成驗證證據。

以 `rg -l --glob '*.{test,spec}.{ts,tsx,js,jsx}' 'isOperator|course-admin-menu' apps packages` 找到 7 個需要逐一檢查、改寫或明確排除的測試檔：

- `apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/[coursePackId]/page.test.tsx`
- `apps/saas/app/(authenticated)/(main)/(account)/admin/course-pack/page.test.tsx`
- `apps/saas/app/(authenticated)/(main)/(account)/admin/newsletter/actions.test.ts`
- `apps/saas/app/api/course/ai-notes/generate/route.test.ts`
- `apps/saas/modules/shared/lib/nav-menu-items.test.ts`
- `packages/api/modules/course/lib/course-instructor-access.test.ts`
- `packages/permissions/is-operator.test.ts`

## 0.2 選單資料來源盤點

使用 Node.js 讀取並解析下列三份來源：

- `packages/platform/src/mount-points.ts`
- `apps/saas/modules/shared/lib/nav-menu-items.ts`
- `apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx`

### Mount points

| id | route | label | operator | group |
| --- | --- | --- | --- | --- |
| start | `/app` | 開始 | 否 | - |
| course | `/course` | 課程 | 否 | - |
| course-admin | `/admin/course` | 課程管理 | 是 | course-admin |
| quiz | `/quiz-admin` | 測驗管理 | 是 | course-admin |
| assignment | `/assignment-admin` | 作業管理 | 是 | course-admin |
| pages-cms | `/admin/pages` | 頁面管理 | 是 | - |
| review | `/review-admin` | 評價與留言管理 | 是 | course-admin |
| chatbot | `/support` | 客服 | 否 | - |
| ai-assistant | `/ai` | AI 助手 | 否 | - |
| settings | `/settings/general` | 帳號設定 | 否 | - |
| admin | `/admin/users` | 後台設定 | 是 | - |
| bundles | `/admin/bundles` | 課程綁定包 | 是 | course-admin |
| onboarding-surveys | `/admin/onboarding-surveys` | 新生問卷 | 是 | course-admin |
| media-library | `/admin/media` | 媒體庫 | 是 | course-admin |
| course-pack-admin | `/admin/course-pack` | CoursePack 任務 | 是 | course-admin |
| email-settings | `/admin/email-settings` | 郵件設定 | 是 | - |
| newsletter | `/admin/newsletter` | 電子報 | 是 | - |
| admin-organizations | `/admin/organizations` | 組織管理 | 是 | - |
| admin-orders | `/admin/orders` | 訂單管理 | 是 | - |
| admin-revenue | `/admin/revenue` | 營收報表 | 是 | - |
| admin-gateway-config | `/admin/settings/checkout-gateway` | 收款閘道設定 | 是 | admin-settings |
| admin-einvoice | `/admin/settings/einvoice` | 發票設定 | 是 | admin-settings |
| admin-gemini | `/admin/settings/gemini` | Gemini 設定 | 是 | admin-settings |
| admin-ai-provider | `/admin/settings/ai-provider` | AI 助手模型 | 是 | admin-settings |

### `nav-menu-items.ts` 的額外群組

| group id | rendered parent id | label | operator |
| --- | --- | --- | --- |
| course-admin | `course-admin-menu` | 課程 | 是 |
| admin-settings | `admin-settings-menu` | 系統設定 | 是 |

### `admin/layout.tsx` 的第二份選單

| label source | route |
| --- | --- |
| 課程管理 | `/admin/course` |
| CoursePack 任務 | `/admin/course-pack` |
| Gemini API Key | `/admin/settings/gemini` |
| AI 助手模型 | `/admin/settings/ai-provider` |
| `t("menu.users")` | `/admin/users` |
| 訂單列表 | `/admin/orders` |
| 營收結算 | `/admin/revenue` |
| 台灣統一發票 | `/admin/settings/einvoice` |
| 結帳金流 | `/admin/settings/checkout-gateway` |
| `t("menu.organizations")` | `/admin/organizations` |

### 已確認的不一致

- `/admin/course`：兩套資料來源各自維護「課程管理」。
- `/admin/course-pack`：同一路由由 Mount point 與第二份管理選單各自列出。
- `/admin/settings/gemini`：`Gemini 設定` vs `Gemini API Key`。
- `/admin/orders`：`訂單管理` vs `訂單列表`。
- `/admin/revenue`：`營收報表` vs `營收結算`。
- `/admin/settings/einvoice`：`發票設定` vs `台灣統一發票`。
- `/admin/settings/checkout-gateway`：`收款閘道設定` vs `結帳金流`，且前者掛在 `系統設定` 群組。
- `/admin/organizations`：`組織管理` vs `t("menu.organizations")`。

## 0.3 非管理員真實帳號前置條件

查閱專案部署文件後，文件列出的 TEST 網址為 `https://startkiter.aiver.me` 與 `https://test-startkiter.vercel.app`。使用 ego-browser 實際開啟兩者，均回傳：

```text
404 DEPLOYMENT_NOT_FOUND
```

因此目前無法從 TEST 環境確認或建立非管理員登入帳號。這項前置條件維持未完成；在取得可用 TEST 環境或明確授權建立帳號前，不得把 5.3 標記完成，也不得用 fixture/mock 代替真實登入證據。
