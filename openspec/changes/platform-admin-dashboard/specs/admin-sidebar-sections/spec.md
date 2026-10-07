## MODIFIED Requirements

### Requirement: Expandable parent items

A menu item with sub-items SHALL toggle its sub-menu when clicked instead of navigating. When the current path matches one of its sub-items, the sub-menu SHALL be expanded on load. When the parent declares a self label, the first sub-item SHALL link to the parent's own route with that label.

##### Example: Sub-menus

| Parent | Sub-items in order |
| ------ | ------------------ |
| 課程 | 課程列表 (/admin/course), 課程儀表板 (/admin/course/dashboard), 測驗管理, 作業管理, 評價與留言管理, 課程留言, 學員私訊, 課程優惠券, 課程綁定包, 新生問卷, 媒體庫, CoursePack 任務 |
| 系統設定 | Email 設定, 金流設定, 發票設定, Gemini 設定, AI 助手模型 |

#### Scenario: Auto-expand on child page

- **WHEN** the administrator opens `/admin/settings/einvoice`
- **THEN** 系統設定 is expanded and 發票設定 is marked active

#### Scenario: Toggle without navigation

- **WHEN** the administrator on `/admin/users` clicks 課程
- **THEN** the URL stays `/admin/users` and the 12 course sub-items become visible

## ADDED Requirements

### Requirement: Core section links to the platform dashboard

The core section item 控制台 SHALL link to `/admin`.

#### Scenario: Click dashboard

- **WHEN** a platform administrator clicks 控制台
- **THEN** the browser navigates to `/admin` and 控制台 is marked active
