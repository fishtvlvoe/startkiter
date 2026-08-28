## Code Review 報告 — 2026-08-28（Round 2）

**範圍**：只審查 `plan-clean-install-package-repo` 上一輪 Critical 是否已修掉；不改檔。
**檔案**：
- `tooling/scripts/promote-clean-package.ts`
- `tooling/scripts/promote-clean-package.test.ts`
**威脅模型**：會不會把真實 env / pem 帶進乾淨安裝包。

**Verdict：可 commit**
**Critical 數量：0**

---

### 上一輪 Critical 覆核

上一輪問題：腳本 walk 工作樹（不是 git tracked），且 `isForbiddenFileName` 只擋 `.env`、`.env.local`、`.env.production`、`.env.development`。因此 Next.js 常見的 `.env.development.local`、`.env.production.local`、`.env.test` 若出現在 `apps/saas/`，會被當成 included 拷進乾淨包。

#### 確認 1：任何 `.env*` 除 `.env.example`／`.env.template` 是否都被 forbid

**通過。**

現行邏輯：

```78:86:tooling/scripts/promote-clean-package.ts
const ENV_KEEP = new Set([".env.example", ".env.template"]);

const isForbiddenFileName = (relativePath: string) => {
	const parts = relativePath.split("/");
	const base = parts[parts.length - 1] ?? relativePath;
	if (relativePath.endsWith(".pem")) return true;
	if (base.startsWith(".env") && !ENV_KEEP.has(base)) return true;
	return FORBID_BASENAME_PARTS.some((part) => relativePath.includes(part));
};
```

分類順序是 `isAllowed && !isForbidden` 才進 included（L138–141），所以就算路徑落在 `apps/saas/` allow prefix，basename 以 `.env` 開頭且不在 keep 集合，仍會被排除。

會被 forbid 的例子：
- `.env`
- `.env.local`
- `.env.development` / `.env.production` / `.env.test`
- `.env.development.local` / `.env.production.local` / `.env.test.local`
- `.env.staging`、`.envrc`、`.env.vault`、`.env.example.local`

會被保留（不因檔名 forbid）：
- `.env.example`
- `.env.template`

`.pem` 另以 `relativePath.endsWith(".pem")` 擋，不依賴 git 追蹤狀態。

#### 確認 2：測試是否覆蓋 `.env.development.local` 與 `.env.test`

**通過。**

Fixture 直接寫入這兩個檔（含假密鑰內容）：

```41:42:tooling/scripts/promote-clean-package.test.ts
	write("apps/saas/.env.development.local", "PAYUNI_HASH_KEY=super-secret\n");
	write("apps/saas/.env.test", "STRIPE_SECRET_KEY=sk_test_123\n");
```

`classifyPaths` 斷言它們在 `excluded`、不在 `included`：

```92:99:tooling/scripts/promote-clean-package.test.ts
				"apps/saas/.env.development.local",
				"apps/saas/.env.test",
			]),
		);
		expect(result.included).not.toContain("apps/saas/.env.development.local");
		expect(result.included).not.toContain("apps/saas/.env.test");
```

`apps/saas/` 本身是 allow prefix，這組測試證明「允許目錄 + 被禁檔名」不會漏進 included。這正好打到上一輪的失敗路徑。

未單獨寫 `.env.production.local` 測資，但同一條 `base.startsWith(".env")` 規則覆蓋；不構成 Critical。

#### 確認 3：是否還有新的 Critical（會把真實 env/pem 帶進乾淨包）

**沒有新的 Critical。**

對「真實 env / pem 進乾淨包」這條威脅：
- 真實 `.env*`（除 example/template）→ 檔名 forbid，不會進 included，也就不會被 `copyIncluded` 拷走。
- `*.pem` → 檔名 forbid。
- `scanForbiddenContent` 會掃 included 檔裡的 `BEGIN (RSA |OPENSSH )?PRIVATE KEY`。

因此上一輪那條「工作樹上的 Next.js local/test env 被當產品檔拷走」已關閉。walk 工作樹這個設計仍在，但已不再能單獨把 `.env*` / `.pem` 送進包。

---

### CRITICAL（0 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| — | — | 無 | — |

---

### HIGH（3 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| 1 | `promote-clean-package.ts:98-109` `walkFiles` | 仍 walk 工作樹，不是 `git ls-files`。`.env*`／`.pem` 已被檔名擋掉，不再是同一條 Critical。但 allow prefix（`apps/saas/`、`packages/` 等）下**未追蹤**的 `.key`、`.p12`、`credentials.json`、`.npmrc` 仍可能被當成 included。 | 晉升來源改為 git tracked + 檔名 deny list 雙閘；或至少對 `*.key`／`*.p12`／`*.pfx`／`.npmrc` 做 forbid。 |
| 2 | `promote-clean-package.ts:83` | 憑證副檔名只擋 `.pem`。`apps/saas/certs/server.key`、`*.p12`、`*.pfx` 會通過 `isAllowed` 進包。 | `isForbiddenFileName` 對 `.key`／`.p12`／`.pfx` 一併 return true，並加測試。 |
| 3 | `promote-clean-package.ts:73-76` `SECRET_PATTERNS` | 私鑰內容掃描只匹配 `BEGIN (RSA \|OPENSSH )?PRIVATE KEY`。`BEGIN EC PRIVATE KEY`、`BEGIN ENCRYPTED PRIVATE KEY` 不會命中。測試檔刻意跳過掃描（`isTestFile`），若真實鑰匙被寫進 `*.test.ts` 也會進包且不被掃。 | 擴大 PEM 頭匹配；測試 fixture 若含 mock 鑰匙應放在明確 allow 的假資料，不要靠「凡是 test 檔就不掃」。 |

這三項都**不會**讓上一輪那種 `.env.development.local` / `.env.test` 再漏出去，所以不升 Critical。

---

### MEDIUM（3 個）

| # | 位置 | 問題 | 建議 |
|---|------|------|------|
| 1 | `promote-clean-package.test.ts:152-171` | `promoteCleanPackage` 拷檔測試有斷言 demo route 不在 target，但沒斷言 target 沒有 `.env.development.local` / `.env.test`。分類測試有擋，端到端拷檔路徑沒封死。 | 在 copies 測試加 `existsSync(join(target, "apps/saas/.env.development.local")) === false`（`.env.test` 同理）。 |
| 2 | `promote-clean-package.ts:84` | `base.startsWith(".env")` 大小寫敏感。若磁碟上檔名是 `.ENV.local` / `.Env.Test`，不會被這條規則擋。macOS 預設大小寫不敏感，實務較少，但仍是 denylist 缺口。 | 改 `base.toLowerCase().startsWith(".env")`，keep 集合也用小寫比。 |
| 3 | `promote-clean-package.ts:153-165` | 內容掃描沒有 API key／token 模式。若有人把真鑰寫進被 keep 的 `.env.example`／`.env.template`，或寫進普通 `.ts`，不會被這支腳本擋。這是來源衛生問題，不是上一輪檔名漏網的復發。 | 可加 `sk_live_` / `PAYUNI_HASH_KEY=` 非 placeholder 的啟發式；不要只靠檔名。 |

---

### 通過項目

- 上一輪 Critical 已修：`.env*` 改為 prefix deny + 明確 keep list，不再寫死四個檔名。
- `.env.example` / `.env.template` 可留在包內；`.env.example.local` 會被禁。
- 測試覆蓋 `apps/saas/.env.development.local` 與 `apps/saas/.env.test`：excluded 含它們、included 不含它們。
- `*.pem` 檔名 forbid。
- allow prefix 無法壓過 forbidden 檔名（`isAllowed && !isForbidden`）。
- 無硬編碼密鑰／API key。
- 無 merge conflict marker。
- 未發現 `__return_true` / WordPress SQL 類問題（本檔為 Node 晉升腳本，不適用 WP checklist）。
- `scanForbiddenContent` 仍會擋 `startkiter.aiver.me` 與常見 PRIVATE KEY 區塊；命中則 throw、不寫 target。

---

### 結論

CRITICAL 0 / HIGH 3 / MEDIUM 3 — **可 commit**

上一輪那條「Next.js `.env.development.local` / `.env.test` 被當 included 拷進乾淨包」已關掉，測試也打到同一路徑。沒有新的 Critical 會把真實 env 或 `.pem` 帶進乾淨包。

殘餘風險（不擋 commit）：腳本仍 walk 工作樹；`.key`／`.p12` 未列入檔名禁單；內容掃描對 EC／encrypted PEM 不完整。建議下一輪補，不必為上一輪 Critical 再開修。
