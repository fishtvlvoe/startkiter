## ADDED Requirements

### Requirement: Platform admins keep the platform workspace on admin paths

For a user with platform admin permission, any pathname starting with `/admin` SHALL resolve to the platform workspace, so the sidebar, account menu, and mobile tabs stay on the platform admin menu. For users without platform admin permission, workspace resolution SHALL be unchanged.

##### Example: Resolution by role

| User | Pathname | Workspace |
| ---- | -------- | --------- |
| platform admin | /admin/course/quiz | platform |
| platform admin | /admin/course/dashboard | platform |
| platform admin | /admin/dashboard | platform |
| course instructor (not platform admin) | /admin/course/quiz | app course, role app-admin |
| learner | /course | app course, role app-user |

#### Scenario: Platform admin on course quiz page

- **WHEN** a platform administrator opens `/admin/course/quiz`
- **THEN** the sidebar shows the five sections, 課程 is expanded, 測驗管理 is active, and the workspace label is 總管理員

#### Scenario: Course instructor unchanged

- **WHEN** a course instructor without platform admin permission opens `/admin/course/quiz`
- **THEN** the sidebar shows the course admin menu as before this change

## MODIFIED Requirements

### Requirement: Account menu does not duplicate sidebar entries

The account menu SHALL NOT contain entries whose destination already appears in the sidebar for every role. The account menu SHALL NOT contain the account settings entry (`/settings/general`) or the documentation entry (`/support`). The account menu SHALL NOT contain entries linking to routes that have no page; the app admin settings entry (`/admin/{appId}/settings`) is removed because `/admin/course/settings` has no page.

##### Example: Account menu entries by workspace

| Workspace | platformAdmin | Entries |
| --------- | ------------- | ------- |
| app, app-user | false | upgrade, logout |
| app, app-admin | false | upgrade, logout |
| app, app-user | true | platform-admin-settings, upgrade, logout |
| platform | true | upgrade, logout |

#### Scenario: Learner account menu

- **WHEN** a learner without admin roles opens the account menu on `/course`
- **THEN** the menu shows only "我的訂閱" and "登出"

#### Scenario: No dead link for course instructor

- **WHEN** a course instructor without platform admin permission opens the account menu on `/admin/course/quiz`
- **THEN** the menu does not contain a link to `/admin/course/settings`
