# admin-sidebar-sections Specification

## Purpose

Admin sidebar sections organize the platform admin navigation into fixed, collapsible sections with expandable sub-menus, so administrators can find every admin page without a long flat list.

## Requirements

### Requirement: Default sections in fixed order

On any `/admin/...` page, a platform administrator's sidebar SHALL show menu items not placed in a user-created group under five section headings in this order: core, content, members, billing, system. Items without a declared section SHALL appear under an "other" heading after system. A section with no visible items SHALL NOT render its heading.

##### Example: Section contents

| Section | Items in order |
| ------- | -------------- |
| core | 控制台 |
| content | 課程, 頁面管理 |
| members | 用戶, 組織, 電子報 |
| billing | 訂單管理, 營收報表 |
| system | 系統設定 |

#### Scenario: Platform admin opens email settings

- **WHEN** a platform administrator opens `/admin/email-settings` with no user-created groups
- **THEN** the sidebar shows the five headings in the order above with the listed items, and no "管理" heading

#### Scenario: User-created group takes precedence

- **WHEN** the administrator has dragged 訂單管理 into a user-created group
- **THEN** 訂單管理 appears in that group and not under the billing section


<!-- @trace
source: admin-sidebar-grouped-nav
updated: 2026-10-07
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
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


<!-- @trace
source: admin-nav-polish-batch1
updated: 2026-10-08
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
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


<!-- @trace
source: admin-nav-polish-batch1
updated: 2026-10-08
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
### Requirement: Mobile overflow includes sub-items

On viewports using the bottom tab bar, the "更多" list SHALL include every sub-item of parent items that are not among the fixed tabs, so every admin page is reachable on mobile.

#### Scenario: Email settings on mobile

- **WHEN** a platform administrator opens the "更多" list at 390px width
- **THEN** the list contains an entry linking to `/admin/email-settings`

<!-- @trace
source: admin-sidebar-grouped-nav
updated: 2026-10-07
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
### Requirement: Core section links to the platform dashboard

The core section item 控制台 SHALL link to `/admin/dashboard`.

#### Scenario: Click dashboard

- **WHEN** a platform administrator clicks 控制台
- **THEN** the browser navigates to `/admin/dashboard` and 控制台 is marked active

<!-- @trace
source: platform-admin-dashboard
updated: 2026-10-07
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->

---
### Requirement: Accessible custom group controls

The collapse button of each user-created group SHALL expose `aria-expanded` and `aria-controls`. The rename button SHALL have `aria-label` "重新命名分組" and SHALL be visible when focused by keyboard.

#### Scenario: Keyboard focus on rename

- **WHEN** a keyboard user tabs to a group's rename button
- **THEN** the button is visible and announces "重新命名分組"

<!-- @trace
source: admin-nav-polish-batch1
updated: 2026-10-08
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->