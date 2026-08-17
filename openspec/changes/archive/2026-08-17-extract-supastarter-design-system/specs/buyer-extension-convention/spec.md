## ADDED Requirements

### Requirement: A written module convention document exists

The repository SHALL contain a document at docs/buyer-extension-convention.md that describes the folder shape, entry-point file name, and environment-variable declaration pattern a new feature module MUST follow, using an existing package under packages/ as a concrete worked example.

#### Scenario: Convention document names a real example package

- **WHEN** docs/buyer-extension-convention.md is read
- **THEN** it MUST reference at least one existing directory under packages/ by its real path and MUST show that package's actual index file content or an accurate excerpt of it

##### Example: Course package as the worked example

- **GIVEN** packages/course/src/index.ts exists in the repository with real exported functions
- **WHEN** docs/buyer-extension-convention.md is read
- **THEN** it MUST contain the literal path `packages/course/src/index.ts` and an excerpt of that file's actual exports, not a fabricated or simplified stand-in

### Requirement: Convention is written for an AI coding tool audience, not a human tutorial

The convention document SHALL be structured as direct, imperative instructions (folder layout rules, naming rules, required files) rather than narrative prose explaining concepts, so that a buyer's own AI coding tool (such as Claude Code or Cursor) can follow it mechanically.

#### Scenario: Document contains actionable rules, not narrative explanation

- **WHEN** docs/buyer-extension-convention.md is read
- **THEN** it MUST contain a checklist or numbered rule list describing required files and their exact relative paths for a new module, and MUST NOT rely solely on prose paragraphs to convey the required structure

##### Example: Rule list format

- **GIVEN** a new module named `packages/newsletter`
- **WHEN** docs/buyer-extension-convention.md is read
- **THEN** it MUST contain a numbered list such as "1. Create `packages/<name>/src/index.ts` exporting the module's public API" rather than only a paragraph describing that packages generally follow a similar shape
