## ADDED Requirements

### Requirement: Account menu does not duplicate sidebar entries

The account menu SHALL NOT contain entries whose destination already appears in the sidebar for every role. The account menu SHALL NOT contain the account settings entry (`/settings/general`) or the documentation entry (`/support`).

##### Example: Account menu entries by workspace

| Workspace | platformAdmin | Entries |
| --------- | ------------- | ------- |
| app, app-user | false | upgrade, logout |
| app, app-admin | false | app-admin-settings, upgrade, logout |
| app, app-admin | true | app-admin-settings, platform-admin-settings, upgrade, logout |
| platform | true | upgrade, logout |

#### Scenario: Learner account menu

- **WHEN** a learner without admin roles opens the account menu on `/course`
- **THEN** the menu shows only "我的訂閱" and "登出"

### Requirement: Platform admin reaches platform settings from any app workspace

The account menu SHALL show the platform admin settings entry linking to `/admin/settings` when the signed-in user is a platform administrator and the current workspace is an app workspace. It SHALL NOT show that entry in the platform workspace, where the sidebar already lists platform pages.

#### Scenario: Platform admin on course page

- **WHEN** a platform administrator opens the account menu on `/course`
- **THEN** the menu contains an entry linking to `/admin/settings`

#### Scenario: Non-platform admin on course page

- **WHEN** a course administrator without platform admin permission opens the account menu on `/course`
- **THEN** the menu does not contain an entry linking to `/admin/settings`
