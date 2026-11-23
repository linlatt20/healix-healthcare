# Healix — Care Without Borders

## Introduction

**Healix** is a multilingual healthcare companion for foreigners living in Korea.
Language barriers, an unfamiliar insurance system and not knowing where to go make
seeing a doctor in a new country stressful. Healix brings everything a foreign
patient needs into one place: AI symptom guidance, medical translation,
English-friendly clinic search and booking, insurance cost estimates and a
community of people in the same situation.

Built by Team 1 for **ASVF 2026**. The project includes a web app, an iOS/Android
app and a shared API server.

**Live demo:** _coming soon_

## Features

- **AI health chatbot**: describe symptoms in your own language and get guidance on what kind of care you may need and which department to visit.
- **Medical translation**: translate medical text between languages, or take a photo of a prescription or medical document and have it translated.
- **Clinic search and AI recommendation**: find clinics by department and spoken language, get AI-recommended clinics for your symptoms, and book an appointment with available time slots shown.
- **Medical interpreter booking**: browse interpreters and book, edit or cancel an interpreter session.
- **Insurance guide and cost calculator**: learn how Korea's National Health Insurance (NHIS) works and estimate your out-of-pocket cost by insurance type and type of medical facility.
- **Personal health record**: store allergies, medications and conditions, and keep a log of past clinic visits.
- **Community**: ask questions, share experiences and comment on posts from other foreign residents.
- **Google sign-in**: sign in with a Google account. Sessions are stored in the database.

## Tech Stack

| Area | Technologies |
|---|---|
| Web | React 19, Vite 7, Tailwind CSS v4, Radix UI (shadcn/ui), TanStack Query, wouter, Framer Motion |
| Mobile | Expo SDK 54, React Native 0.81, expo-router |
| API server | Node.js, Express 5, TypeScript, tsx, pino |
| Database | PostgreSQL, Drizzle ORM, drizzle-kit |
| AI | OpenAI API (GPT-5 mini, GPT-4o mini for image translation) |
| Auth | Google OpenID Connect (`openid-client`), cookie / bearer-token sessions |
| Validation | zod |
| Tooling | pnpm workspaces (monorepo), TypeScript 5.8 |

## Getting Started

### Prerequisites

- **Node.js** 20.19 or later (22 recommended)
- **pnpm** 10: run `corepack enable`, or prefix every command below with `npx pnpm@10.15.0` instead of installing it
- **PostgreSQL**: a local install, Docker, or a free hosted database (Supabase, Neon, etc.)
- An **OpenAI API key** and a **Google OAuth client** (for sign-in)

### 1. Clone and install

```bash
git clone https://github.com/<your-account>/healix.git
cd healix
pnpm install
```

For the mobile app, also align Expo package versions once:

```bash
cd apps/mobile && pnpm fix-deps && cd ../..
```

### 2. Configure environment variables

```bash
cp .env.example .env                          # Windows: copy .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key (required: the server does not start without it) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client credentials |
| `WEB_ORIGIN` | Allowed web origins for CORS (default `http://localhost:5173`) |
| `PORT` | API server port (default `3001`) |

**Google sign-in setup:** in Google Cloud Console, go to *APIs & Services → Credentials →
Create OAuth client ID (Web application)* and add
`http://localhost:5173/api/callback` as an authorized redirect URI.

### 3. Create the database tables

```bash
pnpm db:push
```

Sample clinics and community posts are inserted automatically the first time the server starts.

### 4. Run

| What | Command | URL |
|---|---|---|
| API + web together | `pnpm dev` | http://localhost:5173 |
| API only | `pnpm dev:api` | http://localhost:3001/api/healthz |
| Web only | `pnpm dev:web` | http://localhost:5173 |
| Mobile | `pnpm dev:mobile` | Scan the QR code with Expo Go |
| Type check | `pnpm typecheck` | |

The web dev server forwards `/api/*` requests to the API server.
To test on a phone, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your
computer's LAN IP (e.g. `http://192.168.0.10:3001`).

**VS Code users:** the `.vscode/` folder includes recommended extensions, tasks
(*Ctrl+Shift+P → Tasks: Run Task*) and a debug configuration for the API.
`api.http` lets you try the API with the REST Client extension.

### 5. Deploy (Render + Neon)

In production the API server also serves the built web app, so the whole site
runs as a single service at one URL.

1. Create a free PostgreSQL database on [Neon](https://neon.tech) and copy its connection string.
2. Create the tables in it from your computer:
   ```bash
   DATABASE_URL="<neon-connection-string>" pnpm db:push
   # PowerShell: $env:DATABASE_URL="<neon-connection-string>"; pnpm db:push
   ```
3. On [Render](https://render.com), choose **New → Blueprint** and select this repository.
   `render.yaml` sets up the service. Enter `DATABASE_URL`, `OPENAI_API_KEY`,
   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` when prompted.
4. After the first deploy, add `https://<your-service>.onrender.com/api/callback`
   as an authorized redirect URI of your Google OAuth client.

Manual equivalent: build with `pnpm install --prod=false && pnpm build`, start with
`pnpm start` and set `NODE_ENV=production`. Free Render services sleep when idle,
so the first request after a while can take about a minute.

## Project Structure

```
healix/
├─ apps/
│  ├─ api/                  Express API server (port 3001)
│  │  └─ src/
│  │     ├─ routes/         chatbot, translation, clinics, appointments,
│  │     │                  interpreter, insurance, community, health record, auth
│  │     ├─ middlewares/    session authentication
│  │     └─ lib/            OpenAI client, OIDC auth, logger
│  ├─ web/                  React + Vite web app (port 5173)
│  │  └─ src/
│  │     ├─ pages/          one file per screen
│  │     └─ components/     layout, shared UI, shadcn/ui components
│  └─ mobile/               Expo app
│     └─ app/(tabs)/        Home, AI Chat, Clinics, Translate, Community, Health
├─ packages/
│  ├─ db/                   Drizzle schema, DB client, seed data
│  ├─ api-zod/              shared zod schemas and types for the API
│  ├─ api-client-react/     React Query hooks for calling the API
│  └─ replit-auth-web/      useAuth hook for the web app
├─ .vscode/                 editor settings, tasks, debug config
├─ api.http                 sample API requests
├─ .env.example             environment variable template
├─ package.json             workspace scripts
└─ pnpm-workspace.yaml
```

## License

No license has been chosen for this project yet. Until a `LICENSE` file is added,
all rights are reserved by the Healix team (ASVF 2026, Team 1).
