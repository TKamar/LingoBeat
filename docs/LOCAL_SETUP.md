# LingoBeat — Local Development Setup

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| Docker Desktop | any | https://docker.com |
| PowerShell | 5.1+ | built-in on Windows 11 |

No Google Cloud account, YouTube, Spotify, or Apple credentials needed for local dev.

---

## First-Time Setup

```powershell
# 1. Clone and install dependencies
git clone https://github.com/TKamar/LingoBeat.git
cd LingoBeat\lingobeat
npm install

# 2. Copy environment file
copy .env.example .env
# Edit .env if needed — DATABASE_URL is pre-filled for the Docker PostgreSQL instance
# ANTHROPIC_API_KEY is only needed for Pro/haiku AI analysis (free provider works without it)

# 3. Start Docker services (PostgreSQL + Python analysis service)
docker compose up -d

# 4. Apply DB migrations
npx prisma migrate deploy

# 5. Seed demo users + songs
npx prisma db seed

# 6. Start Next.js
npm run dev
```

Open: http://localhost:3000

---

## What Runs Where

| Service | Runtime | Port | Command |
|---|---|---|---|
| PostgreSQL | Docker | 5433 | `docker compose up -d` |
| Python analysis service | Docker | 8000 | `docker compose up -d` |
| Next.js | Native | 3000 | `npm run dev` |

Next.js runs natively (not in Docker) for fast hot reload and TypeScript compilation.

---

## Demo Logins (No Password / No Google Required)

Navigate to these URLs to log in instantly as a demo user:

| Role | Login URL | Capabilities |
|---|---|---|
| Regular User | http://localhost:3000/api/dev/login-as?email=user@test.dev | Free analysis only |
| Pro User | http://localhost:3000/api/dev/login-as?email=pro@test.dev | Haiku AI + free |
| Admin User | http://localhost:3000/api/dev/login-as?email=admin@test.dev | All providers + /admin |

These dev login URLs **do not work in production** — they return 404 when `NODE_ENV=production`.

To log out, clear your browser cookies or visit a different login URL.

---

## Demo Songs

| Song | Language | Player URL |
|---|---|---|
| Papaoutai — Stromae | French | http://localhost:3000/player/demo |
| Je veux — Zaz | French | http://localhost:3000/player/aaaaaaaa-0000-0000-0000-000000000002 |
| 99 Luftballons — Nena | German | http://localhost:3000/player/aaaaaaaa-0000-0000-0000-000000000003 |
| Despacito — Luis Fonsi | Spanish | http://localhost:3000/player/aaaaaaaa-0000-0000-0000-000000000004 |

---

## Importing Songs

LingoBeat uses **direct MP3 URLs** — no YouTube/Spotify/Apple connection needed.
Synced lyrics are fetched automatically from [lrclib.io](https://lrclib.net) (free, no API key).

```powershell
npx tsx scripts/import-song.ts `
  --title "La Vie en Rose" `
  --artist "Edith Piaf" `
  --lang fr `
  --audio "https://your-audio-host.com/song.mp3"
```

The script prints a player URL on success. If lrclib.io has no result for the song, provide a local `.lrc` file:

```powershell
npx tsx scripts/import-song.ts --title "X" --artist "Y" --lang fr --audio "https://..." --lrc path\to\lyrics.lrc
```

---

## Role-Based Provider Access

| Role | Allowed providers |
|---|---|
| `user` | `free` only |
| `pro` | `haiku` (Claude AI), `free` |
| `admin` | `haiku`, `sonnet`, `free` |

Users can switch their provider via the player header toggle (within their role's allowed set). Attempting to switch to a disallowed provider returns HTTP 403.

---

## Daily Dev Workflow

```powershell
# Start services (if not running)
docker compose up -d

# Start Next.js
npm run dev

# Run tests
npm test

# Reset and re-seed DB (drops all data)
npm run db:reset
npx prisma db seed
```

---

## Environment Variables

```env
# Required for all local dev
DATABASE_URL="postgresql://lingobeat:lingobeat@127.0.0.1:5433/lingobeat"
AUTH_SECRET="any-random-string-works-for-local-dev"
NEXTAUTH_URL="http://localhost:3000"
PYTHON_SERVICE_URL="http://localhost:8000"
ANALYSIS_PROVIDER="haiku"

# Required for Pro/haiku AI analysis (free provider works without this)
ANTHROPIC_API_KEY="sk-ant-..."

# Not needed for local dev (Google OAuth bypassed by dev login endpoint)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

---

## Troubleshooting

**"User not found" from dev login URL**
Run `npx prisma db seed` to create the demo users first.

**Word analysis returns an error**
Check the Python service: `curl http://localhost:8000/health`
If it's not running: `docker compose up -d`

**DB connection refused**
Ensure Docker Desktop is running, then: `docker compose up -d`

**TypeScript errors after a migration**
Regenerate the Prisma client: `npx prisma generate`

**Port 5433 already in use**
Another PostgreSQL instance may be running. Stop it or change the port in `docker-compose.yml` and `.env`.
