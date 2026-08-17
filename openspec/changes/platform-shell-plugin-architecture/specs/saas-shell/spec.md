## MODIFIED Requirements

### Requirement: Operator navigation reaches settings
When a signed-in operator views the authenticated AppShell navigation, a link to /admin/settings MUST be visible. Learners MUST NOT see that link.

#### Scenario: Operator nav includes settings
- **WHEN** a signed-in operator views a page that renders AppShell
- **THEN** a link targeting /admin/settings MUST be present in the sidebar navigation

#### Scenario: Learner nav omits settings
- **WHEN** a signed-in learner whose email is not ADMIN_EMAIL views AppShell
- **THEN** the document MUST NOT contain a hyperlink to /admin/settings

## ADDED Requirements

### Requirement: AppShell covers all four authenticated routes
The routes /app, /course, /agent, and /admin/settings SHALL all render inside the AppShell component. Neither /agent nor /admin/settings MUST render the SiteNav component.

#### Scenario: Agent route uses AppShell
- **WHEN** a signed-in learner requests /agent
- **THEN** the response body MUST contain the AppShell sidebar structure and MUST NOT contain the SiteNav top-bar structure

#### Scenario: Settings route uses AppShell
- **WHEN** a signed-in operator requests /admin/settings
- **THEN** the response body MUST contain the AppShell sidebar structure and MUST NOT contain the SiteNav top-bar structure

### Requirement: Locale switcher lives in the sidebar user area, color mode toggle stays in the top bar
Within AppShell, the locale switcher SHALL be rendered inside the sidebar user area (adjacent to the signed-in user's avatar). The color mode toggle SHALL remain in the top bar's control area. The top bar MUST NOT render a locale switcher.

#### Scenario: Locale switcher appears in the sidebar
- **WHEN** AppShell renders for a signed-in user
- **THEN** the locale switcher control MUST be located within the sidebar user area DOM subtree

#### Scenario: Color mode toggle appears in the top bar
- **WHEN** AppShell renders for a signed-in user
- **THEN** the color mode toggle control MUST be located within the top bar DOM subtree, and the top bar subtree MUST NOT contain a locale switcher control

### Requirement: Narrow viewport renders a bottom tab bar with an overflow drawer
When the viewport width is below 768px, AppShell SHALL render a bottom tab bar in place of the sidebar. The tab bar SHALL show exactly 3 fixed navigation items (開始, 課程, 客服) plus one fixed "更多" (more) item. Selecting "更多" MUST open a drawer listing all remaining mount-point menu items not shown in the fixed 3, including 帳號設定 when the user is an operator. Adding additional Plugin menu items MUST NOT increase the number of fixed tab bar slots.

#### Scenario: Narrow viewport shows the 4-slot tab bar
- **WHEN** AppShell renders at a viewport width of 375px
- **THEN** the bottom tab bar MUST contain exactly 4 items: 開始, 課程, 客服, 更多

#### Scenario: More drawer lists overflow items
- **WHEN** a signed-in operator at 375px viewport width taps 更多
- **THEN** the drawer MUST list 帳號設定 as one of its entries

##### Example: Tab bar slot count is stable as menu items grow
| Registered menu items | Fixed tab bar slots |
| ---------------------- | -------------------- |
| 4 (開始/課程/客服/設定) | 4 (3 fixed + 更多) |
| 8 (adding 4 future Plugin menu items) | 4 (3 fixed + 更多) |

#### Scenario: Wide viewport shows the sidebar, not the tab bar
- **WHEN** AppShell renders at a viewport width of 1280px
- **THEN** the response MUST render the sidebar navigation and MUST NOT render the bottom tab bar
