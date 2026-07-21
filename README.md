# Bete

Ethiopian real estate marketplace (Jiji-style) — Node.js/Express API and Next.js frontend.

## Local Development with Docker

Start Postgres, the backend API, and Adminer:

```bash
# 1. Copy env templates (never commit the real .env files)
cp .env.example .env
cp backend/.env.example backend/.env

# 2. Build and start all services (from project root)
docker compose up --build
```

Or from `backend/`:

```bash
npm run docker:up
```

Once the stack is up, apply the Prisma schema (after Prompt 2 has generated it) **inside the backend container** — do not run Prisma against a host-local database:

```bash
npm run docker:migrate
```

| Service | URL |
|---------|-----|
| API | http://localhost:4000 |
| Adminer (DB browser) | http://localhost:8080 |
| Postgres | `localhost:5432` |

Useful scripts (run from `backend/`):

| Script | Purpose |
|--------|---------|
| `npm run docker:up` | `docker compose up --build` |
| `npm run docker:down` | Stop the stack |
| `npm run docker:migrate` | `prisma migrate dev` inside the backend container |
| `npm run docker:studio` | Prisma Studio inside the backend container |
| `npm run docker:logs` | Follow backend container logs |

**Notes**

- `DATABASE_URL` must use the Compose service hostname `postgres` (not `localhost`) so the API container can reach the database.
- Deploy with the Dockerfile `production` stage only — never ship the `dev` image.
- Always run Prisma migrate/generate/studio via `docker:migrate` / `docker:studio` (inside the container), never as bare `npx prisma …` on the host.
