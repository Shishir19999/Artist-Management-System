# Artist Management System

Next.js 16 (App Router, React 19, TypeScript 7, Tailwind CSS 4 + daisyUI 5) + Prisma 7 (MySQL/MariaDB via the `@prisma/adapter-mariadb` driver adapter) + NextAuth v4 app for managing users, artists and their music. Requires Node 24 LTS (`engines.node >=24`).

Tooling notes: ESLint is on 9.x (eslint-plugin-react/jsx-a11y/import used by `eslint-config-next` do not support ESLint 10 yet); `typescript` is aliased to `@typescript/typescript6` for typescript-eslint while `tsc` (TypeScript 7) comes from `@typescript/native`; NextAuth stays on v4 because Auth.js v5 is still beta; Prisma CLI reads `prisma.config.ts` (needs `DATABASE_URL`, loaded from `.env`).

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the values (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
3. `npx prisma migrate deploy` (or `npx prisma migrate dev` while developing) and `npx prisma generate`.
4. Set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (min 8 chars) and run `npx prisma db seed` to create the first ADMIN (idempotent).
5. Optional demo data: also set `SEED_DEMO_PASSWORD` (min 8 chars) before `npx prisma db seed` to create `manager@artist.local` (ARTIST_MANAGER), `user@artist.local` (USER), 3 artists and 6 songs. The seed is idempotent (upserts by email / title) and can be re-run safely.
6. `npm run dev` and open http://localhost:3000

### Local MySQL/MariaDB and demo logins

Any MySQL 8 / MariaDB 10.6+ works (CI/Docker use MariaDB 12.3 LTS), e.g. `DATABASE_URL="mysql://root@127.0.0.1:3306/artist_db"` after `CREATE DATABASE artist_db;`. All 23 migrations apply cleanly to an empty database (`npx prisma migrate deploy`) and the result matches `schema.prisma` (no drift).

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | value of `SEED_ADMIN_EMAIL` | value of `SEED_ADMIN_PASSWORD` |
| ARTIST_MANAGER | `manager@artist.local` | value of `SEED_DEMO_PASSWORD` |
| USER | `user@artist.local` | value of `SEED_DEMO_PASSWORD` |

The sidebar only shows the links the signed-in role can open (Artist, Music for everyone; User for ADMIN only). The client calls the API via relative `/api/...` URLs, so any dev port works.

## Scripts

- `npm run dev` - development server
- `npm run build` / `npm start` - production build and server
- `npm run lint` - ESLint
- `npm test` - Vitest unit tests (authz, role matrix, register, tokenVersion revocation, schemas)

## Notes

- Roles: `ADMIN` (everything), `ARTIST_MANAGER` (artists and music), `USER` (read-only, only artists they created and their music).
- Authorization: `src/proxy.ts` gates `/admin/**` and `/api/**` (except `/api/auth/**`); every route handler also calls `authorize()` from `src/lib/authz.ts`. Unauthenticated API calls get 401, wrong role 403. Only ADMIN can create/update users and assign roles. Password hashes are never returned.
- `/login` redirects to `/auth/login`. `GET /api/auth/token` returns only the caller's id and role.
- Auth: NextAuth with credentials (bcrypt) and Google (optional, see [docs/GOOGLE_OAUTH.md](docs/GOOGLE_OAUTH.md)), JWT sessions, Prisma adapter. Google users are always created as `USER`; an email that already exists under another sign-in method is refused (no automatic account linking).
- Public sign-up: `/auth/register` -> `POST /api/auth/register` (always role `USER`, Zod validated, bcrypt, 409 on duplicate email, 10 requests / 15 min / IP in-memory rate limit) and signs the user in. `/api/users` stays ADMIN-only.
- Logout revocation: `User.tokenVersion` is stored in the JWT and re-checked against the DB on every session read (`jwt` callback, used by `authorize()`). It is incremented on logout and when an admin changes a user's password or role, so a copied old JWT returns 401. Note it is per user: logging out signs the user out everywhere.
- Admin UI lives under `/admin`; auth pages under `/auth`.
- API routes are under `src/app/api` (`users`, `artists`, `musics`).

## Deployment (Docker)

Files: `Dockerfile` (multi-stage: deps -> migrate -> builder -> runner, Next.js `output: "standalone"`, `node:24-bookworm-slim`, non-root), `docker-compose.yml` (MariaDB 12.3 LTS + one-shot `migrate` job + `app`), `.dockerignore`, `.env.docker.example`.

```bash
cp .env.docker.example .env        # set DB_PASSWORD, DB_ROOT_PASSWORD, NEXTAUTH_SECRET, NEXTAUTH_URL
docker compose up -d --build       # db -> migrate (prisma migrate deploy) -> app on :3000
# create the first admin (once):
docker compose run --rm -e SEED_ADMIN_EMAIL=you@example.com -e SEED_ADMIN_PASSWORD=a-long-password migrate npx prisma db seed
```

Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL/MariaDB URL (compose builds it from `DB_PASSWORD`) |
| `NEXTAUTH_SECRET` | JWT signing secret, required (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public URL of the site (https in production) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional; enable Google sign-in (see docs/GOOGLE_OAUTH.md) |
| `SEED_*` | Only for `prisma db seed` |

Without Docker: `npm ci && npx prisma migrate deploy && npm run build`, then `node .next/standalone/server.js` (copy `public` and `.next/static` into the standalone folder) or `npm start`. Put a TLS-terminating reverse proxy in front for production and make sure it sets `X-Forwarded-For` (used by the register rate limit). The rate limiter is in-memory, i.e. per instance.
