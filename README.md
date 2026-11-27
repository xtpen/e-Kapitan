# eKapitan

**Your barangay, a tap away.** eKapitan is a web platform that lets residents request barangay documents, report concerns, book the court and send print jobs from their phone, and gives barangay staff one place to process it all.

It is a thesis project (Laguna College, San Pablo City) built for a single-barangay pilot in **Barangay Sto. Angel, San Pablo City, Laguna**. The current build is a **working prototype**: the full interface runs in the browser on sample data, and the backend is used only for the AI assistant.

> New to the project? Read [`docs/PRODUCT.md`](docs/PRODUCT.md) (who it's for and the product rules), then [`docs/DESIGN.md`](docs/DESIGN.md) before touching any screen.

---

## What's in it

| Who | What they can do |
|---|---|
| **Everyone** (landing page) | Learn what eKapitan does, sign in, sign up, or continue as a guest. |
| **Guests** (no account) | The resident app with fewer features: report a concern and track it, track any request by its number, read announcements, see the barangay officials, verify a printed barangay document, ask Ka-Barangay AI. Resident-only services ask them to sign up. |
| **Residents** | Request documents (clearance, residency, indigency, …), file complaints and reports, send print jobs (free), reserve the court, follow every request in one list, get notifications, manage their profile. |
| **Admins** | Overview dashboard and notifications, process document requests, complaints, printing and court bookings, manage residents and officials, publish announcements, edit services and the chatbot, see reports and audit logs. Each admin has My account, Settings (display, accessibility, guided tour) and Sign out in the sidebar. |
| **Super admins** | Everything admins do, plus **Users & permissions**: add staff accounts, set each person's role (super admin, admin, records, front desk, …) and which areas they can use. |

Built for senior citizens on budget Android phones: 16px body text, a **Large text** switch that scales the whole app, touch targets of at least 44px, and colors chosen for WCAG 2.1 AA contrast.

## Quick start

**You need:** [Node.js](https://nodejs.org) 20 or newer (npm comes with it).

```bash
git clone https://github.com/xtpen/e-Kapitan.git
cd e-Kapitan
npm run install:all
```

Then start the two servers, each in its own terminal:

```bash
npm run dev:backend     # API on http://localhost:3000
npm run dev:frontend    # app on http://localhost:5173
```

Open **http://localhost:5173**. The frontend forwards every `/api` request to the backend, so keep both running.

### Ka-Barangay AI (optional)

The AI assistant works without any setup: it answers from a built-in knowledge base. To get Gemini answers instead, create `backend/.env` from the example and add your key:

```bash
cp backend/.env.example backend/.env    # on Windows PowerShell: Copy-Item backend/.env.example backend/.env
```

```env
GEMINI_API_KEY="your-key-here"
```

Restart the backend after changing `.env`. Never commit `.env`; it is already in `.gitignore`.

## Demo sign-in

Three seed accounts. Passwords are not checked in the prototype: type anything with 1+ characters.

| Account | Email | You get |
|---|---|---|
| **Resident** | `maria@email.ph` (or any other email, or an 11-digit mobile number starting with `09`) | Resident portal, signed in as Maria |
| **Admin** | `admin@ekapitan.local` | Admin portal, signed in as Juan Carlos T. Ramos (Barangay Secretary) |
| **Super admin** | `superadmin@ekapitan.local` | Admin portal plus Users & permissions, signed in as Roberto V. Gomez (Punong Barangay) |
| no account | **Continue as guest** | Guest mode: the resident app with fewer features |

Any email containing `superadmin` opens the super admin portal, and any other email containing `admin` opens the admin portal.

"Forgot password?" accepts any 6-digit code. Signing up shows the "waiting for verification" message; it does not sign you in.

Everything you create (requests, reports, bookings) lives in browser memory and **resets when you reload the page**.

## Scripts

Run these from the project root.

| Command | What it does |
|---|---|
| `npm run install:all` | Installs frontend and backend packages. |
| `npm run dev:frontend` | Starts the app with hot reload on port 5173. |
| `npm run dev:backend` | Starts the API on port 3000. |
| `npm run typecheck` | Type-checks the frontend. Should report 0 errors. |
| `npm run build` | Production build of the frontend (`frontend/dist`) and backend (`backend/dist`). |
| `npm start` | Runs the built backend, which also serves the built app. Run `npm run build` first. |

### Run the production build

```bash
npm run build
npm start               # app and API together on http://localhost:3000
```

One server serves everything: the app, its files (cached for a year, since their names change on every build) and the `/api` routes. Set `PORT` to use another port; hosts such as Cloud Run set it for you. To try only the built frontend, use `npm --prefix frontend run preview` (http://localhost:4173).

## Tech stack

| Part | Uses |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4, lucide-react icons, Motion (animations) |
| Backend | Node.js, Express, Google Gen AI SDK (Gemini), dotenv |
| Design | Custom design system (tokens in `frontend/src/index.css`, primitives in `components/ui`), Inter + Poppins |

## How it's put together

- **One app, three accounts plus guests.** `App.tsx` picks a layout for the signed-in role: `ResidentShell` for residents and guests (guests get fewer features), `AppShell` for admins and super admins (super admins also see Users & permissions). Navigation is by tab state, not URLs, so the address bar doesn't change between screens.
- **State lives in the browser.** `context/BarangayContext.tsx` holds all records and actions, seeded from `data/mockData.ts`. There is no database yet.
- **The backend is small.** `backend/server.ts` serves `/api/health` and `/api/ai-assistant` (Gemini with a built-in fallback). Once built, the same server also serves the app.
- **Screens load on demand.** Each area (resident and guest, admin, shared) is its own download, so a guest on a phone never downloads admin code.

## Project structure

```
e-Kapitan/
├── docs/                     Product brief, design system, open questions, thesis context, demo script
├── frontend/
│   ├── public/               favicon.svg (the eKapitan mark; same shape as ui/Logo.tsx)
│   ├── src/
│   │   ├── App.tsx           Role → layout, tab → screen, lazy-loaded screens
│   │   ├── config/           barangay.ts: barangay name, city, province (change them only here)
│   │   ├── context/          BarangayContext: app state and actions
│   │   ├── data/             mockData.ts (sample records), reference.ts (puroks, concern types)
│   │   ├── types.ts          Shared data types
│   │   ├── index.css         Design tokens, motion curves, mobile base styles
│   │   └── components/
│   │       ├── ui/           Design-system primitives: Button, Card, Field, DataTable, Calendar, …
│   │       ├── layout/       AppShell, ResidentShell, toasts, page skeletons
│   │       ├── auth/         Landing page and the Sign in / Sign up dialog
│   │       ├── guest/        Guest mode: Home, Track, Account, "Sign up to …" pages, access rules
│   │       ├── legal/        Privacy Policy, Terms and Conditions, Data Privacy Notice
│   │       ├── resident/     Resident portal screens
│   │       ├── admin/        Admin portal screens
│   │       ├── shared/       Used by several roles: Officials, Ka-Barangay AI, Verify, certificate
│   │       └── official/     Announcements page (residents and guests)
│   └── vite.config.ts        Dev proxy to the backend, code-splitting groups
├── backend/
│   ├── server.ts             Express API and AI knowledge base
│   └── .env.example          Copy to .env for the Gemini key
└── package.json              Root scripts for both apps
```

## Working on it

- **Design first.** Every screen follows [`docs/DESIGN.md`](docs/DESIGN.md): use the token classes (`bg-navy`, `text-muted`, …) and the primitives in `components/ui`. Don't add colors, fonts or one-off components.
- **Adding a screen:** build it in the right `components/<area>/` folder, then register it in `App.tsx` with `lazyNamed(() => import('./components/<area>/<File>'), '<Export>')`, not a normal import, and add a `case` for its tab id. Startup files (shells, nav configs, context) stay as normal imports.
- **Barangay details** (name, city, province) live only in `frontend/src/config/barangay.ts`. Puroks and concern types are in `frontend/src/data/reference.ts`.
- **Before a pull request:** run `npm run typecheck` and `npm --prefix frontend run build`, and check your screen at phone width (390px). One screen or feature per branch; pull requests go into `main`.
- **Unsure or waiting on the barangay?** Add it to [`docs/REDESIGN_NOTES.md`](docs/REDESIGN_NOTES.md).

## Known issues

- **The AI knowledge base describes a different barangay.** The built-in text in `backend/server.ts` (used when there is no Gemini key, and given to Gemini as context) names "Barangay San Jose, Pasig City" and its hotlines. Replace it with Sto. Angel's real details.
- **Some sample data still says "Barangay 4A"** (older mock records, verification codes `VER-B4A-…`, legacy screens).
- **No real accounts or database.** Sign-in is simulated and nothing is saved between reloads. SMS notifications are not built.
- **[`docs/presentation-guide.md`](docs/presentation-guide.md) describes the old "Role Switcher"**, which no longer exists. Use the demo sign-ins above instead.

The full list of open questions is in [`docs/REDESIGN_NOTES.md`](docs/REDESIGN_NOTES.md).

## Documentation

| Document | Read it for |
|---|---|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Users, purpose, product rules |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Design system: tokens, components, layouts, motion, accessibility, redesign status |
| [`docs/REDESIGN_NOTES.md`](docs/REDESIGN_NOTES.md) | Open questions, placeholders and follow-ups |
| [`docs/project-context.md`](docs/project-context.md) | Thesis background and scope |
| [`docs/presentation-guide.md`](docs/presentation-guide.md) | Demo script for the defense (partly outdated) |
