## MODIFIED Requirements

### Requirement: Collapsible section headings

Clicking a section heading SHALL hide or show that section's items. When storage is unavailable, all sections SHALL render expanded. The section that contains the current page SHALL always render expanded, regardless of any stored collapsed state. Each section heading button SHALL expose `aria-expanded` matching its state and `aria-controls` referencing the id of its item list.

##### Example: Stored collapse versus current page

| Stored collapsed sections | Current path | Content section | Billing section |
| ------------------------- | ------------ | --------------- | --------------- |
| content, billing | /admin/course/quiz | expanded | collapsed |
| content, billing | /admin/orders | collapsed | expanded |
| none | /admin/users | expanded | expanded |

#### Scenario: Collapse billing

- **WHEN** the administrator clicks the billing heading on `/admin/users`
- **THEN** 訂單管理 and 營收報表 are hidden, the other sections remain visible, and the billing heading has `aria-expanded="false"`

#### Scenario: Current section forced open

- **WHEN** the content section was stored as collapsed and the administrator opens `/admin/course/dashboard`
- **THEN** the content section is expanded and 課程儀表板 is marked active

### Requirement: Expandable parent items

A menu item with sub-items SHALL toggle its sub-menu when clicked instead of navigating. When the current path matches one of its sub-items, the sub-menu SHALL be expanded on load, and the user SHALL still be able to collapse it by clicking the parent. When the parent declares a self label, the first sub-item SHALL link to the parent's own route with that label. Sub-item links SHALL use client-side navigation without a full page reload. The parent toggle button SHALL expose `aria-expanded` and `aria-controls`.

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

#### Scenario: Collapse while on a child page

- **WHEN** the administrator on `/admin/settings/einvoice` clicks 系統設定
- **THEN** the five settings sub-items are hidden and 系統設定 has `aria-expanded="false"`

#### Scenario: Client-side navigation

- **WHEN** the administrator clicks 測驗管理 in the expanded 課程 sub-menu
- **THEN** the sub-item is rendered by the Next.js `Link` component, so the router changes route without a document reload

## ADDED Requirements

### Requirement: Accessible custom group controls

The collapse button of each user-created group SHALL expose `aria-expanded` and `aria-controls`. The rename button SHALL have `aria-label` "重新命名分組" and SHALL be visible when focused by keyboard.

#### Scenario: Keyboard focus on rename

- **WHEN** a keyboard user tabs to a group's rename button
- **THEN** the button is visible and announces "重新命名分組"
