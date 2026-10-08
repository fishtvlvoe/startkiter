## ADDED Requirements

### Requirement: Quick actions open creation dialogs

The quick actions section SHALL list, in this order: `新增課程`, `新增單元`, `寫電子報`, `建立優惠券`, `查看前台`. `新增課程` SHALL link to `/admin/course?action=new-course` and `新增單元` SHALL link to `/admin/course?action=new-lesson`. When `GET /admin/course` loads with a supported `action` query value, the course studio SHALL open the matching dialog after course data finishes loading and SHALL remove the `action` query from the address bar without adding a history entry. The lesson dialog SHALL target the last chapter (highest `order`) of the course the studio selects first, and its description SHALL name that course title and chapter title. Unsupported `action` values SHALL be ignored.

#### Scenario: New lesson from dashboard

- **WHEN** a platform administrator clicks `新增單元` on `/admin/dashboard` and the first studio course has chapters
- **THEN** `/admin/course` opens the `新增單元` dialog targeting that course's last chapter, and the address bar shows `/admin/course` without `action`

#### Scenario: New course from dashboard

- **WHEN** a platform administrator clicks `新增課程` on `/admin/dashboard`
- **THEN** `/admin/course` opens the `新增課程` dialog

#### Scenario: New lesson with no chapter

- **WHEN** `/admin/course?action=new-lesson` loads and the first studio course has zero chapters
- **THEN** no dialog opens and the studio shows the error message `請先新增章節，再新增單元`

#### Scenario: New lesson with no course

- **WHEN** `/admin/course?action=new-lesson` loads and the studio has zero courses
- **THEN** no dialog opens and the studio shows the error message `請先新增課程，再新增單元`

#### Scenario: Refresh after dialog opened

- **WHEN** the dialog opened from `?action=` and the user reloads the page
- **THEN** no dialog opens automatically because the `action` query was removed

##### Example: Action resolution

| action | Courses / chapters (orders) | Result |
| ------ | --------------------------- | ------ |
| new-course | any | open course dialog |
| new-lesson | course A: chapters 1, 2, 3 | open lesson dialog, chapter order 3 of course A |
| new-lesson | course A: no chapters | error `請先新增章節，再新增單元` |
| new-lesson | no courses | error `請先新增課程，再新增單元` |
| delete-all | any | ignored, no dialog |
| (absent) | any | ignored, no dialog |

### Requirement: Single dashboard heading

`/admin/dashboard` SHALL show exactly one page heading, `控制台`. The admin layout heading `後台管理` with subtitle `管理你的應用程式。` SHALL NOT render on `/admin/dashboard`, and SHALL continue to render on every other `/admin/...` page.

#### Scenario: Dashboard heading

- **WHEN** a platform administrator opens `/admin/dashboard`
- **THEN** the page shows `控制台` and does not show `後台管理`

#### Scenario: Other admin page heading unchanged

- **WHEN** a platform administrator opens `/admin/course/dashboard`
- **THEN** the page still shows `後台管理` above its own content

### Requirement: Overview numbers fit on one line on mobile

At a 390px wide viewport, each overview number SHALL render on a single line without horizontal page scrolling, for revenue amounts up to `NT$ 999,999`. At widths of 1024px and above, the overview SHALL keep four cards in one row.

#### Scenario: Mobile revenue card

- **WHEN** the dashboard renders revenue `NT$ 8,830` at a 390px viewport
- **THEN** `NT$ 8,830` occupies one line and `document.documentElement.scrollWidth` equals 390

#### Scenario: Six-digit revenue on mobile

- **WHEN** the dashboard renders revenue `NT$ 999,999` at a 390px viewport
- **THEN** the amount occupies one line inside its card
