## Purpose

This capability defines a bounded screen-design completion milestone distinct from application integration. It makes each planned local screen, interaction and state independently reviewable without representing providers or authentication as implemented.

## ADDED Requirements

### Requirement: The screen matrix SHALL enumerate every in-scope destination

The matrix SHALL map every destination in the approved local navigation to a role, content layout, primary action, return path, acceptance kind, required states, owner and evidence. A generic description SHALL NOT count as an implemented design. Destinations outside the bounded matrix SHALL remain explicitly deferred.

#### Scenario: A setting lacks an actual layout

- **WHEN** a settings destination has only a generic explanation
- **THEN** its design status remains incomplete until an appropriate field layout and observable preview path are present

##### Example: Domain settings

- **GIVEN** settings/domains exists in navigation
- **WHEN** its preview is reviewed
- **THEN** domain, verification status, unconfigured/error examples and return action are visible, with provider integration labeled unconnected

### Requirement: Each preview screen SHALL expose recoverable states

In-scope screens SHALL provide normal, empty, loading, error, denied, unconfigured and success layouts through clearly labeled preview controls where those states apply. State applicability SHALL be documented. Preview controls SHALL NOT mutate storage, authorization or provider configuration; errors SHALL preserve entered fixture data and expose retry or return.

#### Scenario: Creator previews a list error and recovers

- **WHEN** an email campaign list is switched to its error preview and retry is selected
- **THEN** the error identifies the simulated boundary and the normal preview returns without sending mail or losing query state

##### Example: Campaign list recovery

- **GIVEN** campaign preview search contains Intro
- **WHEN** error preview then retry is selected
- **THEN** Intro remains the query and no message is dispatched

### Requirement: Design acceptance SHALL retain existing local workflows

The accepted design SHALL preserve product editing, local storage, acquisition snapshots, role boundaries and the legacy preview path. Desktop and mobile SHALL expose the same primary tasks and explicit preview boundaries; each matrix row SHALL have inspected browser evidence before being labeled ready for design acceptance.

#### Scenario: New designs preserve an acquired bundle

- **WHEN** a new screen-design batch replaces view templates
- **THEN** stored products and acquired bundle resources remain unchanged and product save/reload still works

##### Example: Stored bundle remains scoped

- **GIVEN** acquired bundle B contains course-ai and course-saas
- **WHEN** the new design is opened at 1440 and 390 pixels
- **THEN** B still contains only those two resources and its stored bytes are not reset
