## MODIFIED Requirements

### Requirement: A written module convention document exists

The repository SHALL contain a document at docs/buyer-extension-convention.md that describes the folder shape, entry-point file name, and environment-variable declaration pattern a new feature module MUST follow, using an existing package under packages/ as a concrete worked example that accurately reflects the current repository state.

#### Scenario: Convention document names a real example package

- **WHEN** docs/buyer-extension-convention.md is read
- **THEN** it MUST reference at least one existing directory under packages/ by its real path and MUST show that package's actual index file content or an accurate excerpt of it

##### Example: Course package as the worked example

- **GIVEN** packages/course/index.ts exists in the repository with real exported functions (the package's entry point is at the package root, not under a `src/` subdirectory)
- **WHEN** docs/buyer-extension-convention.md is read
- **THEN** it MUST contain the literal path `packages/course/index.ts` and an excerpt of that file's actual exports, not a fabricated or simplified stand-in, and MUST NOT claim the entry point is at `packages/course/src/index.ts`
