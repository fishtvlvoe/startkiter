# floating-support-widget Specification

## Purpose

The floating support widget gives signed-in users a persistent support entry without covering other navigation controls.

## Requirements

### Requirement: Widget does not cover the mobile tab bar

Below the `md` breakpoint, the floating support widget SHALL be positioned above the 64px mobile tab bar so that no tab bar button is covered. At `md` and above it SHALL keep its current bottom-right position.

##### Example: Positions

| Viewport width | Widget bottom offset |
| -------------- | -------------------- |
| 390px | at least 80px above the viewport bottom (64px tab bar plus 16px gap) |
| 1440px | 24px (unchanged) |

#### Scenario: Phone tab bar remains clickable

- **WHEN** a user opens any page at 390px width
- **THEN** the widget's bounding box does not overlap the bounding box of any mobile tab bar button

<!-- @trace
source: admin-nav-polish-batch1
updated: 2026-10-08
code:
  - AGENTS.md
  - docs/dashboard/README.md
-->