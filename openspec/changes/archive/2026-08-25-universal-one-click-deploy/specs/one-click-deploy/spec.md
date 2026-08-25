## MODIFIED Requirements

### Requirement: Repository provides a one-click deploy path

The repository SHALL provide a deploy configuration file compatible with at least one one-click deploy provider (Zeabur, Vercel, or Coolify) and a corresponding deploy button or documented deploy URL in the repository README. The repository SHALL additionally provide a standard Dockerfile at `apps/saas/Dockerfile` so the same application can be built and run on any platform or VPS that supports Docker, independent of any single named provider.

#### Scenario: Deploy configuration file exists and is valid

- **WHEN** the deploy configuration file (for example deploy/zeabur.yaml or an equivalent provider manifest) is read
- **THEN** it MUST declare the PostgreSQL database dependency and MUST declare BETTER_AUTH_URL, DATABASE_URL as required environment variables

##### Example: Zeabur manifest declares the required pieces

- **GIVEN** deploy/zeabur.yaml is parsed as YAML
- **WHEN** its `services` or `dependencies` section is inspected
- **THEN** it MUST list a PostgreSQL service and its `env` section MUST list `BETTER_AUTH_URL` and `DATABASE_URL` as required (non-optional) variables

#### Scenario: README documents the deploy path

- **WHEN** README.md is read
- **THEN** it MUST contain a deploy button image or link pointing to the one-click deploy provider's deploy URL for this repository, AND MUST contain a documented Docker-based deploy path that does not name a single required hosting provider

##### Example: Deploy button markdown

- **GIVEN** README.md contains a markdown image link such as `[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates/XXXXX)`
- **WHEN** README.md is scanned for the substring `zeabur.com`
- **THEN** the scan MUST find at least one match pointing to a deploy template URL, not just a plain-text mention of Zeabur

#### Scenario: Dockerfile builds and runs on any Docker-compatible host

- **WHEN** `apps/saas/Dockerfile` is built with `docker build -f apps/saas/Dockerfile .`
- **THEN** the resulting image MUST start successfully with `docker run` and MUST serve HTTP responses on the exposed port, independent of which hosting provider runs the container

##### Example: Local Docker build and run

- **GIVEN** a machine with Docker installed and no StartKiter-specific configuration beyond the repository itself
- **WHEN** `docker build -f apps/saas/Dockerfile . -t startkiter` then `docker run -p 3000:3000 startkiter` are executed
- **THEN** `curl -I http://localhost:3000` MUST return an HTTP response (200 or a valid redirect), not a connection failure
