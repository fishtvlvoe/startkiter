## ADDED Requirements

### Requirement: A course admin can preview the real learner surface from the admin workspace, with a single return entry

The course App's admin surface SHALL provide a "preview learner classroom" control that navigates to `/course/preview`. `/course/preview` SHALL render the same published curriculum content as the real learner surface `/course`, but MUST NOT render any navigation menu (neither the learner menu nor the admin menu); it MUST render exactly one "return to course admin" control that navigates back to `/admin/course`. `/course/preview` MUST be reachable only by a person whose resolved role for the `course` App is `app-admin`; a person without that role who requests `/course/preview` directly MUST be denied by the same route guard already enforced on other `app-admin`-only routes. The real learner surface `/course` MUST NOT gain any new menu entry, button, or role-conditional branch as a result of this requirement.

#### Scenario: Course admin opens the preview from the admin workspace

- **GIVEN** a person whose resolved role for the `course` App is `app-admin`
- **WHEN** that person presses "預覽學員教室" inside `/admin/course`
- **THEN** the browser SHALL navigate to `/course/preview`, showing the same published curriculum a real learner would see, with no menu rendered and exactly one visible "返回課程管理員" control

#### Scenario: Returning from the preview goes back to the admin workspace

- **GIVEN** a course admin is on `/course/preview`
- **WHEN** that person presses the "返回課程管理員" control
- **THEN** the browser SHALL navigate to `/admin/course`

#### Scenario: A non-admin requesting the preview route directly is denied

- **GIVEN** a person whose resolved role for the `course` App is `app-user`
- **WHEN** that person requests `/course/preview` directly by URL
- **THEN** the request MUST be denied by the existing `app-admin` route guard, the same way any other `app-admin`-only route denies a non-admin request

#### Scenario: The real learner surface is unaffected

- **WHEN** a person opens the real learner surface `/course`, regardless of their resolved role for the `course` App
- **THEN** the sidebar menu MUST remain the existing five user-facing entries, with no admin-entry branch, no preview-mode branch, and no third menu source introduced by this requirement
