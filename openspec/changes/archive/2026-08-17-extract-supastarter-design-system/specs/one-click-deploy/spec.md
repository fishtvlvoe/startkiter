## ADDED Requirements

### Requirement: Repository provides a one-click deploy path

The repository SHALL provide a deploy configuration file compatible with at least one one-click deploy provider (Zeabur, Vercel, or Coolify) and a corresponding deploy button or documented deploy URL in the repository README.

#### Scenario: Deploy configuration file exists and is valid

- **WHEN** the deploy configuration file (for example deploy/zeabur.yaml or an equivalent provider manifest) is read
- **THEN** it MUST declare the PostgreSQL database dependency and MUST declare BETTER_AUTH_URL, DATABASE_URL as required environment variables

##### Example: Zeabur manifest declares the required pieces

- **GIVEN** deploy/zeabur.yaml is parsed as YAML
- **WHEN** its `services` or `dependencies` section is inspected
- **THEN** it MUST list a PostgreSQL service and its `env` section MUST list `BETTER_AUTH_URL` and `DATABASE_URL` as required (non-optional) variables

#### Scenario: README documents the deploy path

- **WHEN** README.md is read
- **THEN** it MUST contain a deploy button image or link pointing to the one-click deploy provider's deploy URL for this repository

##### Example: Deploy button markdown

- **GIVEN** README.md contains a markdown image link such as `[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/XXXXX)`
- **WHEN** README.md is scanned for the substring `zeabur.com`
- **THEN** the scan MUST find at least one match pointing to a deploy template URL, not just a plain-text mention of Zeabur

### Requirement: One-click deploy succeeds without payment or OAuth keys configured

A fresh one-click deploy with no PAYUNi, Google, or LINE credentials configured SHALL boot successfully and serve the public pages without returning HTTP 500.

#### Scenario: Fresh deploy boots with only the database connected

- **WHEN** a new deploy is created with only DATABASE_URL and BETTER_AUTH_SECRET set
- **THEN** GET / on the deployed instance MUST return HTTP 200 and MUST NOT return HTTP 500
