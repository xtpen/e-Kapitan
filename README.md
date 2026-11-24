# e-Kapitan

Barangay information management and citizen service platform for **Barangay Sto. Angel, San Pablo City, Laguna** (thesis project, Laguna College).

Residents request documents, book the court, send print jobs and file reports online. Guests use a public website to report concerns and track requests. Barangay staff process everything from an admin portal. See [`docs/PRODUCT.md`](docs/PRODUCT.md) for who it's for and the product rules.

## Run it locally

You need Node.js 20 or newer.

```bash
npm run install:all     # installs frontend and backend packages
npm run dev:backend     # API on http://localhost:3000 (Ka-Barangay AI)
npm run dev:frontend    # app on http://localhost:5173 (proxies /api to the backend)
```

The AI assistant needs a Gemini key: copy `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY`. Without it, Kap falls back to a fixed answer.

Other scripts: `npm run typecheck`, `npm run build` (frontend + backend), `npm start` (serves the built app from the backend).

### Demo logins (prototype only, passwords aren't checked)

| Type in "Email or mobile" | Opens |
|---|---|
| any email or `09…` mobile | Resident portal |
| an email containing `admin` | Admin portal (redesigned) |
| an email containing `staff` / `captain` or `official` | Old Staff / Official screens |
| "Continue as guest" | Public website |

## Project layout

```
docs/                     Design system, product brief, open questions, thesis context, demo script
frontend/                 React 19 + Vite + Tailwind CSS v4
  src/
    App.tsx               Picks the shell for the signed-in role and routes tabs to screens
    config/barangay.ts    Barangay name, city, office hours (change them here only)
    context/              BarangayContext: app state and actions (mock data, no real backend yet)
    data/                 mockData.ts (sample records) and reference.ts (puroks, concern types)
    types.ts              Shared data types
    index.css             Design tokens (colors, type scale, radii), see docs/DESIGN.md
    components/
      ui/                 Design-system primitives (Button, Card, Field, DataTable, …)
      layout/             Shells and app chrome: AppShell, PublicShell, toasts, page skeleton
      shared/             Used by more than one role: Officials, Ka-Barangay AI, Verify, certificate
      auth/               Login and registration
      public/             Guest website pages
      resident/           Resident portal screens
      admin/              Admin portal screens
      staff/, official/   Legacy screens for the old Staff and Official roles (old design)
backend/                  Express server: /api/ai-assistant (Gemini) and serving the built app
```

## Working on the UI

Read [`docs/DESIGN.md`](docs/DESIGN.md) before changing any screen, and use the primitives in `components/ui`.

**Adding a screen:** register it in `App.tsx` with `lazyNamed(() => import('./components/<area>/<File>'), '<Export>')`, not a normal import. Screens load on demand in one chunk per area (`manualChunks` in `frontend/vite.config.ts`), so guests never download admin or staff code. Keep startup files (shells, nav configs, context) as normal imports. Open questions and placeholders waiting on the barangay are tracked in [`docs/REDESIGN_NOTES.md`](docs/REDESIGN_NOTES.md).

Other docs: [`docs/project-context.md`](docs/project-context.md) (thesis background) and [`docs/presentation-guide.md`](docs/presentation-guide.md) (demo script).
