## ADDED Requirements

### Requirement: Interactive blocks accept Mission-driven content as an alternate source
The system SHALL render an existing interactive block using content supplied by an imported Course Pack Mission, in addition to content authored directly in the course editor.

#### Scenario: Mission-sourced content renders through the existing block registry
- **WHEN** a Mission's action surface maps to a registered block
- **THEN** the system SHALL render that block using the Mission's structured action payload as its content source

#### Scenario: Editor-authored content path is unaffected
- **WHEN** a lesson's block content is authored directly through the existing course editor
- **THEN** the system SHALL render it exactly as before, unaffected by the addition of the Mission-driven content source
