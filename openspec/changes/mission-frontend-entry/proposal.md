# Proposal: mission-frontend-entry

## 問題

`CoursePack`／`CoursePackMission`（課程任務系統）後端邏輯完整：資料庫模型、匯入 API（`course-pack-import`）、任務檢查（`run-mission-check.ts`）、表單送出（`submit-mission-form-value.ts`，含加密）、MDX 區塊渲染元件（`MissionBlockRenderer`，已登記進 `BLOCK_REGISTRY`）都有。

但 grep 全 repo 確認：**`apps/saas` 沒有任何頁面引用 `CoursePack`、`MissionBlockRenderer`、`resolveMissionBlock`**。也就是說：
- 後台沒有列表頁能看到已匯入的 CoursePack
- 學員端沒有任何頁面能看到、進入、互動一個 Mission
- 整個系統從匯入到消費，中間完全斷開，是一套「接了一半就沒人接手」的功能

## 修法

範圍鎖定「讓匯入的 CoursePack 真的能被看到、能被互動」，不做大改：

1. **後台**：`/admin/course-pack`（或掛在既有課程管理選單下）列表頁，顯示已匯入的 CoursePack（title、匯入時間、狀態），點進去能看到底下的 Mission 清單
2. **學員端**：一個 CoursePack 詳情頁，逐一渲染底下的 Mission（用既有的 `MissionBlockRenderer`），學員能看到任務說明、送出表單、看到檢查結果
3. 串接既有的 `runMissionCheck`／`submitMissionFormValue` procedure，不新寫後端邏輯

## 不做什麼

- 不改 CoursePack 匯入機制本身（`course-pack-import` 維持不動）
- 不做 CoursePack 跟 Course/Chapter/Lesson 的正式關聯設計（目前 schema 上兩者無關聯，這次不新增，只是讓 CoursePack 獨立可見可用）
- 不做進階功能（任務排行榜、進度追蹤儀表板等），只求「找得到、進得去、能互動、能送出」

## 影響範圍

新增 2 個頁面 + 串接既有 API，不改動任何既有 schema 或後端邏輯，風險低。
