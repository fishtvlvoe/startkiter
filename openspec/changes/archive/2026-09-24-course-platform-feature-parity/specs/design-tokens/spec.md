## Purpose

現在 5 個課程相關檔案寫死深色系文字顏色（`text-neutral-200` 等），淺色主題下看不清楚。改用語意化色票變數，之後要換品牌色或修對比度只改變數，不用逐檔找。

## ADDED Requirements

### Requirement: 語意化色票變數

專案樣式進入點定義 `--heading`、`--body`、`--caption`、`--surface`、`--surface-hover`、`--divider` 等語意化 CSS 變數，淺色/深色主題各自有對應值。

#### Scenario: 淺色主題下文字對比度正確

- **WHEN** 使用者在淺色主題下瀏覽課程管理頁
- **THEN** 標題、正文、輔助文字使用 `--heading`/`--body`/`--caption` 對應的淺色主題數值，文字與背景對比度符合可讀性（不再是寫死的深色系顏色）

### Requirement: 既有硬編碼顏色替換

#### Scenario: 五個已知檔案改用語意化 class

- **GIVEN** `admin/course/page.tsx`、`classroom-client.tsx`、`lesson-tool-embed.tsx`、`course-review-panel.tsx`、`MediaPicker.tsx` 五個檔案目前使用 `text-neutral-*`/`bg-neutral-*` 等寫死類別
- **WHEN** 完成本次改動
- **THEN** 這五個檔案改用語意化 class（`text-heading`/`text-body`/`text-caption` 等），視覺結果在深色主題下不變，淺色主題下對比度修正
