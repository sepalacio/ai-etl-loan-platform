# LoanPro API — Backend

NestJS REST API for unstructured loan document extraction using Claude AI.

## Prerequisites

- **Node.js 22** (managed via [nvm](https://github.com/nvm-sh/nvm) — `.nvmrc` is included)
- **Docker** (for the local Postgres instance)
- **npm**

## 1. Install dependencies

```bash
cd backend
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required secrets:

| Variable | Description |
|---|---|
| `DB_PASSWORD` | Postgres password (must match `docker-compose.yml`) |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 document storage |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for S3 document storage |
| `ANTHROPIC_API_KEY` | Claude API key for document extraction |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials (use [Mailtrap](https://mailtrap.io) locally) |
| `ENCRYPTION_KEY` | 64-char hex key — generate with `openssl rand -hex 32` |

> Variables with defaults (`PORT`, `DB_HOST`, `API_PREFIX`, etc.) can be left as-is for local development.

## 3. Start the database

From the project root

```bash
docker compose up -d
```

This starts a Postgres 16 container (`loanpro-db`) on port **5433** with a named volume for persistence.

> Port 5433 is used to avoid conflicts with a local Postgres instance on 5432.

To stop: `docker compose down` (add `-v` to also remove the data volume).

## 4. Generate and run migrations

Migration files are not committed — they must be generated from the entity definitions against a live database. The database (step 3) must be running before this step.

```bash
# Generate the initial schema migration
npm run migration:generate -- src/database/migrations/InitialSchema

# Apply it
npm run migration:run
```

In **development**, any pending migrations also run automatically on app startup (`migrationsRun: true`). Generating and running once before the first start is still recommended to have an explicit migration file in the repo.

In **production** (`NODE_ENV=production`), auto-run is disabled. Migrations must be run explicitly as a pre-deployment step before starting the new app version:

```bash
NODE_ENV=production npm run migration:run
```

Other migration commands:

```bash
# Generate a migration after entity changes
npm run migration:generate -- src/database/migrations/<MigrationName>

# Revert the last applied migration
npm run migration:revert

# List applied/pending migrations
npm run migration:show
```

> The CLI uses `src/database/data-source.ts` which reads `.env` directly via dotenv — no app bootstrap required.

## 5. Start the dev server

```bash
npm run start:dev
```

The server starts on `http://localhost:3000` (or whatever `PORT` is set to).

## API

| Endpoint | Description |
|---|---|
| `GET /health` | Health check |
| `GET /api/docs` | Swagger UI (development only) |
| `POST /api/applications` | Create a loan application |
| `GET /api/applications` | List applications |
| `GET /api/applications/:id` | Get application details |
| `POST /upload/:token` | Borrower uploads documents via their unique token |
| `GET /api/applications/:id/profile` | Get structured borrower profile for an application |

All protected endpoints require the `X-Lender-Email` header.

## Available scripts

```bash
npm run start:dev       # Development server (watch mode)
npm run start:prod      # Production server (from dist/)
npm run build           # Compile TypeScript
npm run lint            # ESLint with auto-fix
npm run test            # Unit tests
npm run test:cov        # Unit tests with coverage
npm run test:e2e        # End-to-end tests
```
