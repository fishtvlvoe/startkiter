## Why

目前11張active SR各自記錄文書、程式、本機Demo與部署驗收，沒有共同施工順序，Fish無法判斷完整UI是否完成或何時能驗收真正本機網站。本總施工SR只統一里程碑、責任、舊卡收尾與審核回寫，不用累加checkbox宣稱產品進度。

## What Changes

- 新增 docs/blueprint/creator-delivery-master.md 與單一總表入口，按M0收尾、M1完整UI設計驗收、M2真本機殼、M3商品資料保存、M4交易交付、M5營運擴充分層。
- 新增 creator-ui-ux-design-completion、creator-authenticated-shell-integration兩張小SR；既有多課銷售／Bundle／newsletter保留owner，不重建重複SR。
- 修改舊卡收尾紀錄，清楚區分可封存、有規格衝突、缺驗收、缺Git及被取代但未取消工作；只在審核通過與完整封存方案核准後執行archive。
- 新增各小SR的worker packet／檔案owner／前置／驗收證據與主控審核回寫規則；沒有穩定共用契約不得派寫入worker。
- 修改HTML報告以里程碑排序、下一個本機驗收入口／通過條件為主，不再以11張散開checkbox當完整進度。

## Non-Goals

- 不直接實作正式後台、DB、付款、寄信、影音、部署或更改憑證。
- 不因task全勾就封存或因清單落後就重寫；不標取消工作為完成。
- 不合併所有功能成巨型implementation SR；總表不另造資料／授權模型。

## Impact

- Affected specs: none
- Affected code: 本總SR不修改apps/packages；小SR各自建立行為規格與程式owner。
- Affected documents: 本SR artifacts、docs/blueprint/creator-delivery-master.md、creator-sr-closeout-register.md、creator-sr-roadmap-alignment.html、CONTEXT.md與本機dashboard索引。
- Dependencies 新增: 無；Spectra既有流程及ego-browser驗收，sub-agent只做有界任務。
- 環境變數新增: 無。
- Compatibility: 此SR僅治理與證據索引；正式功能行為由小SR或既有SR管理。
