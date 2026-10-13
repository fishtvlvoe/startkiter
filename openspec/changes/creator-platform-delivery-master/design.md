## Context

Fish已核准整理舊SR、建立總表、拆小SR、分工後主控審核回寫。目前UI並未完成全部設計，local-acceptance13/14只證明那張原型範圍；正式新殼／資料庫整合未施工。總表不能把原型完成覆蓋真正網站缺口。

## Goals / Non-Goals

Goals：一張表顯示順序、前置、功能層級、owner、已實測成果、剩餘缺口、下一個本機验收。小SR完成須有主控review及證據链接，不相信worker摘要。

Non-Goals：不在總SR改production行為；不批次刪除／重設dirty修改；不直接把11張工作合成一張巨大工程單。

## Decisions

### 總施工表只管理里程碑，不代替各功能規格

總藍圖保留領域架構；本總施工表保留M0～M5的執行順序／驗收證據。小SR每條只交付一個可觀察流程，UI版型、真本機接線與provider验收分开。

Alternatives Considered：加總所有checkbox百分比，否決，單位不同；以總藍圖直接派全部程式任務，否決，失去route/data owner邊界。

### 舊SR先查證收尾，規格衝突或缺證據不得當垃圾清掉

由唯讀review核對source/tests/Git及archive preview；缺部署的留部署gate，缺Git的留Git，明確已取消需求才寫cancelled對照。已完成紀錄保留，預覽與批准完整方案後才能封存；不得用skip-specs繞過真矛盾。

Alternatives Considered：全部park隱藏清單，否決，隱藏不是收尾；所有全勾立即套spec archive，否決，buyer-journey涉及較新導航規格；原有驗收證據有時效，不能冒充新UI已验。

### 共用契約固定後才分工，主控回跑再寫進總表

小SR每個worker有task、允許檔案、spec場景、命令與禁止事項。主控獨占共享schema/nav/model、Spectra狀態、整合／browser／Git。獨立view並行；依賴未滿足不派寫入worker。審核表須列caller／權限／資料不變／測試／桌面手機證據／未驗證。

Alternatives Considered：所有worker改shared殼，否決，易互蓋；worker自報PASS就勾總表，否決，驗收沒有共同owner。

## Implementation Contract

本SR產出文件，不改業務程式。每個milestone列 `{id, order, dependsOn, scopeKind, childChange, owner, status, entry, exit, evidence, remaining}`。status限定規劃中／待核准／可施工／施工中／待主控審核／可本機驗收／待外部驗收／待Git／完成；不得把task百分比推算產品百分比。

M1只完成完整設計與Demo展示，不宣稱資料庫。M2必須http localhost真App及測試帳號登入看role導航；M3新增CourseOffer真DB保存与重登，沿用銷售SR；M4sandbox交易／指定grant闭環；M5延期各自拆小功能，provider決策不得阻擋M1。現有已完成local view不重寫，但M1不能照搬其未畫完整列表／表單/狀態為完成。

估計：整理第一版總表与小SR為一個批次；不提前承諾全部功能90分鐘。M1正式排程以畫面清單/測試實際工作量校正；每30分鐘回報實體畫面與證據。未承諾日期顯示未排，不填虛構deadline。

## Risks / Trade-offs

[舊delta覆蓋新規格] → archive preview與canonical diff先核對、完整方案核准才執行。

[過時清單重工] → source/tests/code-first核對；先更新原SR再apply，只有不同責任才新建。

[本機與正式混用] → 每目標明列file demo／HTTP app／DB/provider環境與禁止事項，驗收入口分層標示。

[規劃無止境] → 只先完整propose最近M1/M2兩張，其餘沿用原SR或候選；不一次建立所有未来provider巨規格。

## Migration Plan

Expand：總表與closeout register增加在docs，不覆寫原tasks歷史。舊功能仍可運作。

Migrate：審查确认後把相同責任集中到唯一小SR；旧未完成被移交的任务写cancel/transfer mapping，不勾完成。封存只由Spectra core套delta并搬目录。

Contract：owner與引用核對後更新主入口報告，保留舊報告作歷史。Git另scoped plan；無部署、無DB遷移。回退撤回索引引用即可，不改任何業務資料。

## Open Questions

歷史QA封存完整方案等待Fish確認；buyer-journey spec衝突及部署證據待review；完整正式UI layout route-owner需M2 preflight確認。這些不妨礙M1設計清單建立；正式provider政策沿用藍圖register逐題決定。
