## Context

前置是總表M0責任核對，不必等電子報或雲端provider。local-acceptance已提供商品CRUD及三role，但不是完整設計完成。原設定唯讀欄位、PAYUNi未連線、既有3role基線保留。

## Design Source

Source：Fish核准的上方主分類／左側子選單／右側內容；本機creator-local-acceptance.html。Cache：.spectra/design-cache/creator-ui-ux-design-completion/source.dc.html及其當次本機view參考。

精確視覺沿用現有：#faf9f5底、#141413文字、#d97757重點、#d1cfc5邊框，最大1380px／桌面sidebar230px／gap24px／radius7px／button5px；手機760以下折疊、驗收390。標題body sans。沒有新圖示風格，使用現有SVG；不照抄Systeme個資。

## Goals / Non-Goals

Goals：M1範圍內每頁有實體設計/完整可導航路線/各狀態，不再給通用說明框當完成；user可以完整驗介面。Non-Goals：正式資料／auth／provider、付款與自動化實際執行，不新增模組數量或未拍板政策。

## Decisions

### 先固定有限畫面清單，不拿26能力全貌當一輪畫面交付

清單基於現有navigation：平台管理員概況／使用者／角色／模組／版本／平台設定；創作者workbench、CRM contacts/tags/segments/consent、site pages/funnels/forms、email campaigns/templates/delivery、automation rules/workflows/execution、products all/course/bundle/code/saas、sales orders/subscriptions/refunds/coupons、live all/live/evergreen/replays、settings profile/account/payment/subscription/email/domains/integrations；buyer library/catalog及課程／kit／service詳情。可共用layout但每個destination的主題、欄位與動作不能是同一泛用內容。

Alternatives Considered：只畫五個頂部tab，否決，缺子選單與細節；把總藍圖所有future能力一次畫完，否決，範圍無法收斂。未列能力後續分期，不假稱不存在。

### 共用狀態由主控維持，角色view獨立補齊

baseline三role view contract保持，新增state preview資料由主控注入context，不改model/source資料。states normal/empty/loading/error/denied/unconfigured/success具有可見fixture標示與返回，不真的變更authorization/provider。A只admin view/test，B只creator view/test，C只buyer view/test；主控matrix/shared state/nav/整合，worker不改shared檔案。

Alternatives Considered：每worker自己做storage/state controls，否決，造成三套狀態；用disabled死按鈕表示畫面完成，否決，使用者無法驗路線。

## Implementation Contract

輸入是現有深凍結RoleViewContext；主控增加filters.previewState、detailId與fixture revisions，不改version1商品資料。每頁matrix列scopeKind=operable-local或design-preview，pageId與唯一owner、mainAction／back／states／evidence。已有商品操作仍用model save/acquire；未接的表單可以展示校驗與預覽，但不得顯示真正保存成功，不能改商業政策。正常／空／錯／返回可從就地preview控制走通，不要求Fish讀task或route名。

失敗：未知page/state明示不支援，保留原操作路線；role/scope不混合。所有可見控制有本機動作或清楚不可用解釋；鍵盤/焦點/esc與mobile不回退。M1 gate不是table填滿，是每列有實際畫面與主控browser evidence，Fish可以從單一入口走完整認知路線。

驗證：先focused測試各view狀態/欄位/escape/back，主控node --test docs/blueprint/creator-local-*.test.cjs；ego逐頁1440/390，保存／reload／取得／未知命令／failure基線回歸；matrix→evidence逐列映射。只修改docs原型與docs/ux，不改apps/packages或憑證。

## Risks / Trade-offs

[框架太大畫面失焦] → 共用模板+按導航有限清單，缺頁不勾完成；每張角色worker再按states與edit/detail兩個batch分。

[模擬成功誤當串接] → design-preview水印與真本機操作區分；M2才HTTP登入，M3才DB。

[破壞已保存內容] → 原model/nav指紋基線、fixture只在context，不清storage，roll back roleview不刪資料。

## Migration Plan

先matrix／focused tests，後逐role補畫面；主控分batch接線並回归原操作，三role不互改。入口不換網址；保留legacy=1。沒有正式部署／migration，回滾回原view／shared殼，專用保存資料不動。

## Open Questions

每個未接功能的真業務深度在其功能SR決定，不阻擋M1版型；M1畫面庫仍待產出，不能宣稱當前已完全設計。時間安排在matrix確認後用實際批次量估算，不保證90分鐘全部完成。
