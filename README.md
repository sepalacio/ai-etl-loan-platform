# LoanPro

AI-powered loan document extraction system. Lenders create applications and share a unique upload link with borrowers. Borrowers upload PDFs; the backend pipeline classifies, parses, and extracts structured data from each document using Claude AI, then assembles a unified borrower profile.

## Architecture

```
frontend/   React SPA (Vite + Tailwind)  →  http://localhost:5173
backend/    NestJS REST API              →  http://localhost:3000
docker-compose.yml  PostgreSQL 16        →  localhost:5433
```

Full architecture: [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md)
Decision log: [`ADR.md`](./ADR.md)

---

## Prerequisites

- **Node.js 22** — managed via [nvm](https://github.com/nvm-sh/nvm)
- **Docker** — for the local Postgres instance
- **AWS account** — S3 bucket for document storage
- **Anthropic API key** — Claude AI for document extraction
- **Resend API key** — free tier at [resend.com](https://resend.com) (3 000 emails/month, no domain required)

---

## Running the full app

Run these steps in order. Each step assumes the previous ones are complete.

### Step 1 — Start the database

From the project root:

```bash
docker compose up -d
```

This starts a Postgres 16 container (`loanpro-db`) on port **5433**.

---

### Step 2 — Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in the required secrets:

| Variable | Description |
|---|---|
| `DB_PASSWORD` | Postgres password (must match `docker-compose.yml`) |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 document storage |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for S3 document storage |
| `AWS_S3_BUCKET` | S3 bucket name |
| `ANTHROPIC_API_KEY` | Claude API key |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `ENCRYPTION_KEY` | 64-char hex key — generate with `openssl rand -hex 32` |

---

### Step 3 — Run database migrations

The database (Step 1) must be running before this step.

```bash
# From backend/
npm run migration:generate -- src/database/migrations/InitialSchema
npm run migration:run
```

This creates all tables. Only needed on a fresh install — subsequent app starts auto-apply any pending migrations in development.

---

### Step 4 — Start the backend

```bash
# From backend/
npm run start:dev
```

API available at `http://localhost:3000`.
Swagger UI at `http://localhost:3000/api/docs`.

---

### Step 5 — Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`.

---

## Usage

1. Open `http://localhost:5173` and enter your lender email when prompted.
2. Click **+ New Application**, fill in borrower details, and submit.
3. Copy the borrower upload link shown on the confirmation screen.
4. Open the upload link in a browser (or a private window to simulate the borrower) and upload PDF documents.
5. The backend pipeline processes each document automatically. Refresh the application detail page to see documents progress through the pipeline stages.
6. Once all documents are processed, the borrower profile panel populates with extracted income, account, and identity data.

## Ports at a glance

| Service | Port |
|---|---|
| Frontend (Vite) | 5173 |
| Backend (NestJS) | 3000 |
| PostgreSQL | 5433 |
