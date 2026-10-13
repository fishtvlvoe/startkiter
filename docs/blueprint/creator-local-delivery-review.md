# 本機驗收切片交付檢查

日期：2026-10-13。狀態：可本機驗收，尚未 Git 提交／推送；第 11.4 保留待辦，不宣稱整張 SR 完成。

| 自審項目 | 結果與證據 |
| --- | --- |
| 1. 重用／重複 | PASS：重用報告既有 admin／demo CSS，local model 只有一份，UI 與 tests 共同呼叫；不重建正式 Product／Order／Entitlement |
| 2. Tasks 更新 | PASS：SR 11.1～11.3 已按實際測試與瀏覽器證據勾選；11.4 未勾，舊文件歷史不改 |
| 3. 呼叫路徑 | PASS：報告載入 model／UI；UI 實際呼叫 M.load／M.save／M.acquire，tests 同步驗證；入口 HTML 轉至本機 query |
| 4. 行為證據 | PASS（本機範圍）：node:test 25 PASS／0 FAIL；ego 84 PASS／0 FAIL，1440／390，result.json 與截圖在 evidence/local-acceptance-E4uTvk；額外實點程式包／SaaS／課程入口、取消、CRM／直播搜尋與空買家 |
| 5. Secrets | PASS：本輪六個新檔案掃描 sk-/AKIA/ghp_ token patterns 無匹配；沒有讀憑證或新增 env，資料只在專用 localStorage key |
| 6. Git | FAIL／待交付：新增檔案仍 untracked，既有大量 dirty 修改保留；未 stage、commit、push、merge 或部署，不混入其他 runtime 修改 |
| 7. 匹配欄位一致性 | N/A：此切片無 series／跨語系關聯，課程以固定 resource ID 匹配，使用者名稱作搜尋展示而非業務關聯鍵 |
| 8. 真實程式優先 | PASS：存在 creator-local-model.js／creator-local-ui.js，實跑保存→reload→回填→取得；不是只看 tasks 或 build。整張 SR 未完成，不 archive |
| 9. 寫作污染 | N/A：無文章／故事內容生成 |

## RED／GREEN 與檢查邊界

model 初次缺 API 的 TypeError 是初始化缺口，不算行為 RED；補可呼叫 stub 後 22 FAIL／3 PASS 為行為 RED，實作後 25 PASS。UI 施工前 `#local-workspace` 不存在，入口檢查明確 FAIL；接線後實際操作通過。第一次瀏覽器路線在 Tab 預期失敗，實際下一站是返回列表、再名稱欄，修正測試期待後 84 PASS，不改 UI 蒙混。

本機資料驗證涵蓋四商品與一次／月／季／年 16 組合、單課數量、价格名稱、未知資料、讀寫失敗、腐敗版本、買家空內容與快照、重複取得、草稿拒絕、注入字串。不把 simulated acquisition 當 server authorization。

靜態 node --check（model／UI）與 bash -n 通過；git diff --check 通過；Spectra analyze findings=[]、validate valid。html-visualizer 沿用既有模板，不重畫風格；其靜態標籤／inline script／樣式檢查通過。SVG 子檢查會呼叫 Playwright，依專案規則攔截，屬未驗證而非通過；動態本機 mount 的 fallback card 已補。新本機畫面沒有新增 SVG 結構圖，版面與行為由 ego 真實驗證。

未驗證：正式角色／帳號／跨 workspace／付款／續訂／寄信／影音／GitHub／部署；完整輔助科技與全部瀏覽器相容性。未重跑正式應用程式整套 tests；舊 46 PASS 保留為歷史，不充當這輪證據。

## 資料清理與保存

已清除本 Agent 兩次腳本產生的 12 個測試商品及 12 個對應模擬取得快照，依本輪明確名稱識別，不清其它資料或其它 key。保留 4 個預設商品、買家起始為空；clean-home.png 與 clean-buyer-empty.png 已回讀並截圖。沒有刪除 repo 檔案、真實訂單或客戶資料。這些是一次性測試資料，不影響已保存的截圖證據。

本機儀表板 state.json 在鎖內更新至 71／79，明訂這是文件加本機切片 checklist 不是正式產品百分比；線上儀表板未發布。
