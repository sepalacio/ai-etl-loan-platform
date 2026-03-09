# LoanPro — Frontend

React SPA for the LoanPro loan document extraction system.

## Stack

- **React 19** + TypeScript
- **Vite 7** (dev server + build)
- **Tailwind CSS v4**
- **React Router v7**
- **Axios**

## Prerequisites

- **Node.js 22** (see `.nvmrc` in the backend — same version)
- Backend API running on `http://localhost:3000` (see backend README)

## Install dependencies

```bash
cd frontend
npm install
```

## Start the dev server

```bash
npm run dev
```

The app starts on `http://localhost:5173`.

All `/api` and `/upload` requests are proxied to `http://localhost:3000` — no CORS configuration needed in development.

## Pages

| Route | Description | Auth |
|---|---|---|
| `/` | Lender dashboard — list of all applications | Lender email required |
| `/applications/new` | Create a new loan application | Lender email required |
| `/applications/:id` | Application detail — borrower profile, documents, flags | Lender email required |
| `/upload/:token` | Borrower document upload portal | Public (token-scoped) |

### Lender authentication

There is no login page. On first visit, the app prompts for a lender email address, which is stored in `localStorage` and sent as `X-Lender-Email` on every API request. Use the **Switch** link in the nav to change accounts.

## Available scripts

```bash
npm run dev        # Development server with HMR
npm run build      # TypeScript compile + Vite production build
npm run lint       # ESLint
npm run preview    # Preview the production build locally
```
