# Creator HTML Demo 瀏覽器驗收紀錄

日期：2026-10-13
對象：`startkiter-creator-platform-progress-uiux.html` 本機 file URL，不是正式 StartKiter 後台。
工具：ego-browser；原 task spaces 清單為空，為同一目標重建 space 1。
範圍：示意後台導航、課程篩選、方案列表與表單預覽；桌機 1440×1000、手機 390×844。示意名稱、價格與統計不是客戶資料。

## 先失敗，再修正，再回讀

初次 CSS click 沒切換頁面，是平滑捲動尚未完成、目標座標仍在 viewport 外；改以 instant scroll 並等捲動完成後，真實 click 正常，不把這個定位問題算成頁面程式故障。

真正的 Demo 故障：在「草稿」篩選下搜尋 AI，原 handler 只用搜尋條件覆蓋 hidden，顯示兩筆 published 記錄；篩選仍顯示「草稿 2」。現有示意資料實際是 3 堂課、2 published、1 draft。

修正：用同一 applyCourseFilter 合併發布狀態與搜尋；桌機表格與手機卡片讀同一規則；空結果提供清除條件；重設後焦點回搜尋框；篩選標籤改 3／2／1。另更正 CodePackage 說明：獨立販售與訂閱已是目標，不把「能否單賣」重新列為未決，只保留價格、更新及取消政策 gate。

| 實際操作 | 回讀結果 | 證據 |
| --- | --- | --- |
| 桌機初始工作台 | overview 正常呈現示意統計與任務入口 | [desktop-overview.png](evidence/2026-10-13-ui/desktop-overview.png) |
| 點課程與商品→課程與內容→草稿，輸入 AI | view=courses、filter=草稿 1、visible rows=0、emptyVisible=true | [desktop-empty.png](evidence/2026-10-13-ui/desktop-empty.png) |
| 點清除搜尋與篩選 | search=''、filter=全部 3、visible rows=3、focus=courses 搜尋框 | ego-browser DOM 回讀；上方修正流程同輪執行 |
| 點管理銷售方案 | 方案列表顯示指定課程、一次買斷／草稿／規劃中 | [desktop-offers.png](evidence/2026-10-13-ui/desktop-offers.png) |
| 點建立銷售方案→預覽方案 | view=offer-form；回饋明確說互動示意，沒有儲存或發布資料 | [desktop-form.png](evidence/2026-10-13-ui/desktop-form.png) |
| 早期手機嘗試 Home／ArrowDown／Enter 後回讀 offers | selected=offers、view=offers、visible cards=4、viewport=390、documentWidth=390；缺少明確不同before值，不能證明按鍵完成切換 | [mobile-offers.png](evidence/2026-10-13-ui/mobile-offers.png)；只作方案呈現與width證據，不作完整原生鍵盤PASS |
| 手機點編輯方案 | formVisible=true、viewport=390、documentWidth=390 | [mobile-form.png](evidence/2026-10-13-ui/mobile-form.png) |

desktop-empty 與 mobile-offers 的截圖已由主控實際看圖確認，非只讀路徑。其餘舊截圖存在但完整逐張視覺巡查仍待續查，不把它們當全頁驗收已通過。

## 本輪編輯回填與七種狀態

先重現：點第三筆「CodePackage 獨立販售」，表單卻顯示「建立銷售方案」、名稱「AI 自動化入門｜單堂課」、productType=單堂課程、price=''。修正後各編輯入口使用同一組三筆示意 fixture；建立入口清空表單，編輯入口帶名稱、類型、價格、狀態及交付勾選，不把獨立程式包勾成課程資格。

| 操作／檢查 | 實際回讀 | 證據與範圍 |
| --- | --- | --- |
| 桌機點獨立 CodePackage 編輯 | heading=編輯銷售方案、name=CodePackage 獨立販售、type=code、courseGrant=false、kitGrant=true、status=draft | [desktop-kit-prefill.png](evidence/2026-10-13-ui/desktop-kit-prefill.png)；點擊與 DOM 回讀 |
| 空價格按預覽 | aria-invalid=true、focus=price、方案名稱保留；提示 1～2,147,483,647 整數價格 | 同輪 ego-browser 回讀，不是正式儲存 |
| 價格改 8,800 再預覽 | aria-invalid 移除、回饋 NT$ 8,800，明寫沒有儲存或發布 | 上圖是修正後示意，不代表程式包正式售價已定案 |
| 返回列表再點建立 | heading=建立銷售方案、name=''、price='' | 同輪回讀，不沿用上筆資料 |
| 正常／載入／空／錯誤／denied／disabled／success | 七個 fixture 的 panel／layout.hidden／inert 逐項檢查；disabled 保留畫面但 inert=true，讀取失敗與 denied 隱藏操作資料 | [desktop-error-state.png](evidence/2026-10-13-ui/desktop-error-state.png)；以 ego-browser DOM change event 啟動 fixture，不是原生鍵盤操作證據 |
| 每個狀態點恢復／重試 | 回 normal、panelHidden=true、inert=false、focus=demo-ui-state；denied 返回 overview | 6 次真實恢復按鈕點擊與 DOM 回讀，沒有呼叫後端或影音／付款 provider |
| 手機點獨立 CodePackage 編輯 | name=CodePackage 獨立販售、type=code、documentWidth=390、viewport=390 | [mobile-kit-prefill.png](evidence/2026-10-13-ui/mobile-kit-prefill.png)；手機頁面切換以 DOM change，編輯按鈕真實 click |
| 一次付清不顯示收款週期 | 修正前 hidden=true 但 height=69.921875；修正後 hidden=true、height=0 | `.demo-form label` 的 display:grid 原先蓋過 hidden；新增僅限 Demo 的 hidden 規則 |

本輪新增三張截圖，持久化截圖合計九張；desktop-error-state 與 mobile-kit-prefill 已主控看圖。第一次原生 state select 鍵盤自動化沒有改變值，未列通過；後續 DOM fixture 檢查只驗證狀態渲染與恢復邏輯，不能替代原生選單／鍵盤驗收。狀態控制列與成功提示均明寫示意、不連後端。

## 未通過完整驗收的項目

### 直播原型篩選修正

先真實點即時直播，原型aria-pressed仍[true,null,null]、visibleRows=2，確認三按鈕只有外觀。修正只在HTML原型：live filter與course filter用不同data attributes，活動標live／evergreen；更新pressed與hidden，不發provider／報名／CRM請求。

同一 `verify-demo-ui.sh` 增六asserts（每viewport的live/evergreen/all），實跑exit0、46 PASS/0 FAIL，兩尺寸分別回讀live→[live]、evergreen→[evergreen]、all→[live,evergreen]。本輪12圖與[result.json](evidence/2026-10-13-ui-script-QLKWsh/result.json)持久化；[1440-live](evidence/2026-10-13-ui-script-QLKWsh/1440-live.png)／[390-live](evidence/2026-10-13-ui-script-QLKWsh/390-live.png)已主控看圖。歷史sWRXGe的40 PASS仍是修正前其它路徑證據，最新46不覆蓋它；總保存圖36張，不代表36個全情境。

原型Live三篩選不再無作用；完整原生keyboard／所有按鈕／角色／server mutation／真正影音与回滾仍未過，不新增SR runtime完成勾選，2.8 pending／文件68／75保持。

### 可重跑原型驗收腳本

[verify-demo-ui.sh](verify-demo-ui.sh) 以 ego-browser heredoc 執行，先查同名任務空間是否唯一且agent-owned，核對已存在的本機報告tab；不takeover、開正式站或碰其它工作空間。嵌入Node runtime未接收到shell env，腳本改由已核准space/tab定位並在該runtime建立專屬/tmp截圖目錄，不偽造不存在的配置。

本輪命令 `bash docs/blueprint/verify-demo-ui.sh` exit0，40 assertions PASS/0 FAIL，1440/390跑搜尋＋草稿、清條件/焦點、單課/Bundle/kit三種回填、kit不暗授課、建立清空、名稱/零價錯誤/改正預覽、contacts/live切換、native char typeahead error與恢復、水平溢出。腳本逐assert輸出JSON；前兩次真正失敗（env未傳／crm selector實際為contacts）已修驗收腳本，不改Demo配合錯誤測試。

持久化結果與12張本輪圖在 [result.json](evidence/2026-10-13-ui-script-sWRXGe/result.json)，總已保存圖24張（舊12＋本輪12，不是24個完整情境）。已主控看圖 [1440-form](evidence/2026-10-13-ui-script-sWRXGe/1440-form.png)、[390-contacts](evidence/2026-10-13-ui-script-sWRXGe/390-contacts.png)、[390-live](evidence/2026-10-13-ui-script-sWRXGe/390-live.png)；圖示皆為假資料原型，不是真實CRM/活動/收款資料。

unverified隨JSON結果一起輸出：ArrowDown原生popup、完整Tab/Shift+Tab/Escape/focus trap、真正保存與所有欄位同時錯誤、登入角色/跨workspace/server denial、未施工模組/provider/rollback。Live頁三個活動類型按鈕目前尚未接filter handler，不能把頁面能開當成每個按鈕可用；仍須修正/驗收。2.8完整腳本與全UI gate保持pending，不把40局部PASS擴成正式站完成。

### 原生鍵盤隔離與真正通過的局部路徑（2026-10-13）

依 spectra-debug 重現／隔離，不修改 Demo 以掩蓋問題。ego-browser task space 1仍agent-owned，沒有碰其它工作空間。ArrowDown/Enter在Demo state select確有trusted keydown、defaultPrevented=false、document.hasFocus=true，但value仍normal；不是事件沒到或Demo擋default action。

`/tmp/startkiter-native-keyboard-probe.html`只有原生select/options、input與記錄keydown，不含Demo/framework。相同ArrowDown/ArrowDown/Enter仍value=a；原生文字input的真實鍵事件可填x；只改隔離探針select.size=3去除彈出選單後，ArrowDown使value=b。這定位了當前瀏覽器/CDP原生popup控制路徑的差異，不足證明已修好工具或已查完內部機制；沒有把正式Demo改成列表或用指定value過關。

另以保留原select的原生typeahead驗證：fresh Page.reload後，focus state select，CDP Input.dispatchKeyEvent type=char/text=讀，before=normal、after=error，收到trusted change=true，panelHidden=false；之後實際點重試回normal、focus=demo-ui-state。這次沒有 `.value=...`、selectedIndex或人工dispatch change。截圖 [desktop-error-native-char.png](evidence/2026-10-13-ui/desktop-error-native-char.png) 已主控看圖，viewport=1440/documentWidth=1425（含捲軸）；持久化截圖共十二張。

隔離探針tab已關閉，space 1只留原HTML；focus emulation已恢復false，diagnostic listeners/arrays已移除。probe檔案只在/tmp，不是產品artifact；本輪沒有修改app/runtime、沒有安裝或變更ego/Chromium設定檔。原生typeahead局部路徑通過，不把它擴成ArrowDown popup、mobile、Tab/Shift+Tab/Escape、所有頁面／角色／mutation或2.8完整acceptance script通過。

### 功能範圍導讀

本輪 HTML 加入五個可展開分區，連到 26 類已知能力與 75 項原文件待辦索引。ego-browser 已逐一真實點擊五個 summary，回讀 open=true；桌機 viewport=1440、documentWidth=1425（含捲軸），手機 viewport=documentWidth=390，五分區均保持展開。截圖 [desktop-capability-groups.png](evidence/2026-10-13-ui/desktop-capability-groups.png) 與 [mobile-capability-groups.png](evidence/2026-10-13-ui/mobile-capability-groups.png) 已主控看圖，持久化截圖共十一張。截圖後再把分區中的 Contact／CMS／builder 等說明改成白話中文；這次文字修訂仍須最終巡查，不把舊截圖當成修訂後逐像素驗收。

- 新流程圖的配色尚待首次 diagram-design 樣式確認，未繪圖；依賴表本身仍在 handoff，16 個節點已做無循環／無缺失前置檢查。
- Demo 已有共用七種 fixture、價格錯誤及恢復，但每頁的專屬 provider error、完整 invalid input、實際保存及全路徑仍未驗收；示意成功不是真實保存。
- 三種編輯入口已接示意回填，桌機／手機獨立 CodePackage 與建立清空已實測；單課／Bundle、取消後重新進入、交付變更與完整回歸仍需逐項驗證。
- CRM／直播、日期切換、每個選單／按鈕、完整 Tab／Escape 焦點與桌機／手機全路徑仍待巡查。
- 沒有驗證正式站、付款、Email、GitHub、影音 provider、資料遷移或部署；沒有執行應用程式測試。本 HTML 明確是 prototype。

這些缺口保留在驗收表與後續工作，不把「已有截圖」視為總藍圖或 UI 全部完成。HTML 本輪同步文件進度為 21／75；沒有因原型修正多勾 runtime 或總體 UI 待辦。
