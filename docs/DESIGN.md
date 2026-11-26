# eKapitan Design System

> **AI assistants: read this whole file before you change any UI.** It is the single source of truth for how eKapitan looks. If something you need is not covered here, copy the closest existing pattern. Do not invent new colors, fonts, radii or shadows. If you really need something new, stop and ask the person you're working with. That person should check with the foundation owner (ppen) before adding it here.

Also read `PRODUCT.md` (who the users are and the product rules) before designing anything.

---

## 1. Source of truth

The visual direction comes from the **"eKapitan UI Mockups"** HTML board (18 screens). When this file and the mockup disagree, **this file wins**. A few mockup inconsistencies are resolved in section 11.

| # | Mockup screen | Width |
|---|---|---|
| 1 | Public homepage | 1280 |
| 2 | Login and registration | 1280 |
| 3 | Resident · Dashboard | 1280 |
| 4 | Resident · Document request | 1280 |
| 5 | Resident · Court reservation | 1280 |
| 6 | Admin · Overview | 1280 |
| 7 | Public · Homepage (mobile) | 390 |
| 8 | Resident · Dashboard (mobile) | 390 |
| 9 | Resident · Document request (mobile) | 390 |
| 10 | Resident · Court reservation (mobile) | 390 |
| 11 | Resident · Complaints | 1280 |
| 12 | Resident · Printing | 1280 |
| 13 | Admin · Document requests | 1280 |
| 14 | Admin · Court calendar | 1280 |
| 15 | Resident · Complaints (mobile) | 390 |
| 16 | Admin · Overview (mobile) | 390 |
| 17 | Admin · Requests (mobile) | 390 |
| 18 | Admin · Court approvals (mobile) | 390 |

Screens without a mockup (e.g. My Profile, Notifications, Personnel, Audit Logs) must be built **only** from the patterns in this file.

### Character in one sentence
A calm, trustworthy civic service. Deep navy authority, a green that means "go / done", one warm gold accent, on a warm cream paper background. The UI is plain and spacious and uses large text. It is built for senior citizens on cheap Android phones, not for designers.

---

## 2. Stack and where things live

- React 19 + Vite + **Tailwind CSS v4** (`@import "tailwindcss"` with an `@theme` block in `frontend/src/index.css`).
- Icons: **lucide-react** (already installed).
- Design tokens: the `@theme` block in `frontend/src/index.css` (section 3). **Use the token classes** (`bg-navy`, `text-muted`, `border-line`, …). Never hard-code hex values in components.
- Shared UI primitives: `frontend/src/components/ui/`, imported from `'../ui'`. **Check this folder before building a component.** If a primitive you need is missing, ask ppen rather than making a private copy inside your screen. Available now:
  - `Button` (`variant`: primary | secondary | accent | danger, `size`: md | sm, `fullWidth`)
  - `Card` (`tone`: default | callout | navy, `padded`: md | lg), `CardHeader`, `TextLink`
  - `StatusPill` plus the status maps `documentStatus`, `incidentStatus`, `appointmentStatus`. Always use these maps, never write your own labels.
  - `StatCard`, `IconTile`, `PageHeader` (with optional `breadcrumb` and `action`)
  - `Field` (label + help + error wrapper; render prop gives the control its `id` and aria props) with `Input`, `PasswordInput` (Show/Hide toggle), `Select`, `Textarea`, and a large `Checkbox`
  - To hide a `Button` at some screen sizes, wrap it (`<span className="hidden sm:block">`). A `hidden` class on the Button itself loses to its built-in `inline-flex`.
  - `FileUpload` (drop zone with a "Choose file" button and a list of picked files with Change/Remove; `files`, `onChange`, `accept`, `multiple`, `hint`). **Never use a bare `<input type="file">`**; put size and type limits in the Field's `help`.
  - `Stepper` (`steps`, `current` index)
  - `DataTable` (table on tablet/desktop, stacked cards on phones; you supply `columns` and a `mobile` title/status/meta)
  - `formatPeso(50)` → "₱50.00", `formatShortDateTime(...)` → "Sep 9, 8:30 AM"
  - `ProgressTimeline` (`stages`: label, tone, reached, detail, optional note)
  - `Calendar` (month view with Previous/Next, day states `available` / `booked` / `closed` / `past`, selected day in navy, and a legend; `renderDayExtra` lets the admin calendar put event chips in each day; `isSelectable` makes any day clickable; `legend` replaces the default legend; the `open` day state is a plain white day). Use `toISODate()` for its YYYY-MM-DD keys.
  - `TimeSlot` (radio-style slot button with an Available / Booked pill)
  - `AttentionPanel`: wrap any Add or Edit form that opens in a side panel, and give it `key={panel}` so it runs again each time the form opens. It slides in with a short navy glow, scrolls into view and puts the cursor in the first field. With reduce motion on, it skips the animation.
  - `FilterChips` (pill filters with counts; navy when active; wrap on desktop, swipe on phones). Used by Notifications and My Requests; admin lists can use it for status filters.
  - `DataTable` also takes `isSelected` to highlight the chosen row in list + detail layouts.
  - **Sorting:** give a column `sortValue: row => …` (text sorts A to Z, numbers low to high) and its header becomes clickable (click again to reverse, arrow shows the order); phones get a "Sort by" menu above the cards. `defaultSort={{ header, direction }}` sets the starting order. `sortLabels` names the directions in plain words: dates use `['oldest first', 'newest first']`; status columns sort by **workflow stage** (`sortValue: r => STATUS_ORDER.indexOf(r.status)`, labels `['by stage', 'by stage, reversed']`), never alphabetically. Make the main columns of every admin list sortable (done for Residents, Document Requests, Complaints, Printing Requests).
  - **Long lists (hundreds of rows):** set `pageSize={25}` and `itemLabel="residents"` for pages ("Showing 1–25 of 282 residents", Previous / page menu / Next; resets to page 1 when filters or sort change), and `dense` for tighter rows. Clickable rows support **arrow keys** (up/down moves and opens the next row). Pair it with a match count above the table, counts on filter chips, and a detail panel that stays in view (`lg:sticky`). Reference: Admin · Residents.

  Reference implementations: the Documents list (`resident/ServicesDirectory.tsx`) and the request form (`resident/DocumentRequestWizard.tsx`) show fields, validation, stepper, review and confirmation done the house way.
- App shell: `frontend/src/components/layout/AppShell.tsx`. It takes `groups` (sidebar sections), `bottomNav`, `notificationsTab` and `unreadCount`. Every role uses this same component with its own nav config. Don't fork it per screen. The resident config is in `components/resident/residentNav.tsx`; the admin config is in `components/admin/adminNav.tsx` (already wired up for the demo `admin` role). Admin teammates: build your screen in `components/admin/`, then in `App.tsx` replace the component for your `admin_…` tab id. Until then each tab shows the old screen or a "Not built yet" placeholder.

---

## 3. Design tokens

### 3.1 Colors

| Token (Tailwind name) | Hex | Use |
|---|---|---|
| `navy` | `#12304F` | Brand. Headings, active sidebar item, banners, logo disc, secondary-button outline, selected state |
| `navy-deep` | `#0C2238` | Public-site utility bar only |
| `navy-tint` | `#EEF3F9` | Selected table row, selected time slot background |
| `on-navy` | `#C9D6E6` | Secondary text on navy backgrounds |
| `ink` | `#1D2A3A` | Body text |
| `muted` | `#556070` | Secondary text, labels in tables, captions, sidebar section titles |
| `primary` | `#1B7A57` | **Primary action buttons**, completed step dots, chart bars |
| `primary-strong` | `#14604A` | Text links, eyebrow text, icon color in green tiles, active top-nav text |
| `primary-tint` | `#E4F2EA` | Green icon tiles, info "callout" cards, avatar background |
| `primary-tint-line` | `#CFE5D8` | Border for green callout cards |
| `gold` | `#F2B84B` | Accent. Logo initials, the one highlighted CTA on a navy banner (`Request a document`). **Max one gold button per screen.** |
| `canvas` | `#F6F3EB` | Page background (warm cream). Never pure white or slate |
| `surface` | `#FFFFFF` | Cards, inputs, top bar, sidebar |
| `surface-muted` | `#F1EFE8` | Disabled / past / not-yet-reached things (past calendar days, booked slots, future steps) |
| `line` | `#E3DDCC` | All card, sidebar and top-bar borders; table header underline |
| `line-soft` | `#EEE9DB` | Table row dividers, placeholder blocks (e.g. "Valid ID preview") |
| `field-line` | `#8A93A0` | Input / select / textarea border (darker for visibility) |
| `mist` | `#F5F7FA` | **Landing page only.** Alternating section background and the frame behind the example request |
| `hairline` | `#E3E8EF` | **Landing page only.** Borders on white and mist |

**Landing page palette.** The landing page is white + navy only, with `mist` and `hairline` as its neutrals: no cream, gold or green. The one exception is green for the "Ready for pickup" moment in the example request, where it means success. Signed-in screens keep the full palette above.

**Status tones.** Always used as a background + text pair:

| Tone | Background | Text | Meaning |
|---|---|---|---|
| `success` | `#D8F0E3` | `#0F5A3E` | Done, approved, ready, available, resolved |
| `info` | `#DCE9FA` | `#1B3F7A` | In progress, processing, under review, unassigned |
| `warning` | `#FFF0C9` | `#6A4A00` | Waiting on someone, pending |
| `danger` | `#FBE0DD` | `#8B2418` | Rejected, booked, closed, declined, error |
| `neutral` | `#F1EFE8` | `#5C5C5C` | Not reached yet, inactive |

Icon tiles use the same pairs (danger tile background is `#F7E1DC`). The **destructive button** is solid `#8B2418` with white text.

### 3.2 Typography

Fonts (Google Fonts): **Poppins** 600/700 for headings and big numbers, **Inter** 400/600/700 for everything else. This replaces Lexend and Outfit. Remove them from `index.html` when the foundation lands.

| Role | Desktop | Mobile | Font / weight | Color |
|---|---|---|---|---|
| Hero title (public site only) | 46px / 1.12 | 30px | Poppins 700 | navy (white on navy hero) |
| Page title `h1` (inside the app) | 32px / 1.2 | 24px | Poppins 700 | navy |
| Section title `h2` | 28px / 1.25 | 22px | Poppins 600 | navy |
| Card title `h3` | 18px | 17px | Poppins 600 | navy |
| Form card title | 22px | 20px | Poppins 600 | navy |
| Big stat number | 38px / 1 | 30px | Poppins 700 | navy |
| Body | **16px / 1.55** | 15px / 1.5 | Inter 400 | ink |
| Secondary text (`muted`) | 15px | 14px | Inter 400 | muted |
| Labels, nav items, buttons | 15–16px | 15–16px | Inter 600 | ink |
| Status pill | 13px | 12px | Inter 600 | tone text |
| Table header, sidebar section title, eyebrow | 12–13px, UPPERCASE, letter-spacing .06–.08em | same | Inter 600 | muted (eyebrow: primary-strong) |

Rules:
- **Nothing smaller than 12px.** The current code uses `text-[9px]`, `text-[10px]` and `text-[11px]`. Those go away.
- Use `rem`-based Tailwind sizes so the existing **Large text** mode keeps scaling everything.
- Headings are never gray, and body text is never navy.

### 3.3 Spacing, radius, shadow

- Spacing scale (px): 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64. The defaults to reach for are **20** (gap between cards), **24** (card padding), **32** (form-card padding, page padding top) and **40** (page side padding).
- Radius: **8** small chips/nav links · **10** buttons, inputs, sidebar items, day cells · **12** time slots · **14** icon tiles, mobile cards · **16** cards · **20** banners · **full** pills, avatars, logo.
- Shadow: flat by default (border only). One elevation, `0 8px 24px rgba(18,48,79,.10)`, is used only on floating/standalone cards (login, hero overlap cards). Don't add shadows to cards inside the app.
- No gradients. No glassmorphism, no blur.

### 3.4 Tailwind v4 tokens (live in `frontend/src/index.css`)

All tokens are defined in the `@theme` block of `frontend/src/index.css` (owned by ppen). That file is the source. Don't copy values into components. The class names they create:

| Kind | Classes |
|---|---|
| Colors | `bg-*` / `text-*` / `border-*` with every name in 3.1: `navy`, `navy-deep`, `navy-tint`, `on-navy`, `ink`, `muted`, `primary`, `primary-strong`, `primary-tint`, `primary-tint-line`, `gold`, `canvas`, `surface`, `surface-muted`, `line`, `line-soft`, `field-line`, and the tone pairs `success-bg`/`success-fg`, `info-*`, `warning-*`, `danger-*` (plus `danger-tile`), `neutral-*` |
| Fonts | `font-sans` (Inter, the default), `font-display` (Poppins, automatic on h1–h3) |
| Text sizes (rem) | `text-label` 12 · `text-caption` 13 · `text-meta` 15 · `text-base` 16 · `text-h3` 18 · `text-h3-lg` 22 · `text-h2` 28 · `text-h1` 32 · `text-stat` 38 · `text-hero` 46 |
| Radius | `rounded-control` 10 · `rounded-tile` 14 · `rounded-card` 16 · `rounded-banner` 20 · `rounded-full` |
| Shadow | `shadow-float` (floating cards, menus and dialogs only) |

**Large text mode** adds the `large-text` class to `<html>`, which scales the root font size. Use the rem-based text classes above and never `text-[15px]`-style pixel values, or your screen won't scale.

---

## 4. App shell

### 4.1 Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│ (SA) eKapitan                              Maria Santos 🔔 (MS)  │  top bar: white, 1px line bottom, padding 14px 40px
│      Barangay Sto. Angel, San Pablo City                          │
├──────────────┬───────────────────────────────────────────────────┤
│ SERVICES     │  main: padding 32px 40px, bg canvas                │
│ ■ Dashboard  │                                                    │
│ □ Documents  │                                                    │
│ …            │                                                    │
│ ACCOUNT      │                                                    │
│ □ My Profile │                                                    │
└──────────────┴───────────────────────────────────────────────────┘
  sidebar 264px, white, 1px line right, padding 24px 16px
```

- **Logo**: the eKapitan mark (`ui/Logo.tsx`, also `public/favicon.svg`): a navy rounded square with a white roof (the barangay hall) over a dot with a ripple (a tap), "your barangay, a tap away" in one shape. Use `<LogoMark />` (44px in the top bar) and `tone="white"` on navy headers. Never redraw it, recolor it or put a barangay seal in its place (see PRODUCT.md).
- **Brand block**: `eKapitan` Poppins 700 20px navy, with the barangay name 13px muted under it.
- **Right side of top bar**: user name (muted) → notification icon button (44px, 1.5px line border, radius 10) → 44px avatar disc with initials.
- **Sidebar section title**: 12px uppercase, letter-spacing .08em, muted, margin `16px 12px 8px`.
- **Sidebar item**: flex, gap 12, padding 10px 16px, radius 10, Inter 600, ink, 20px icon. **Active = solid navy background, white text and icon**; the navy highlight slides from the old item to the new one (Motion `layoutId`, 320ms ease-out). Hover = `surface-muted`.
- **Collapsible sidebar**: a "Collapse sidebar" button at the bottom shrinks it from 264px to a 76px icon rail (300ms, `ease-drawer`); the choice is saved with the Settings preferences. Only the width animates: icons never move, labels fade, group titles become a short divider, and each icon gets a tooltip and an aria-label. The sidebar is sticky under the top bar and scrolls on its own.
- **Account menu** (avatar): Dark mode and Large text quick switches, "All settings", Sign out. Scales in from its corner.
- **Page switching**: one entrance per navigation. The page rises 8px while fading in (280ms), the old page leaves in 120ms, and the page's own sections rise in one after another (`.page-enter`). The skeleton hands over to the page inside that one entrance, so there is no double fade.

### 4.2 Navigation per role (exact labels and order)

**Resident** (own frame, `layout/ResidentShell.tsx`; every page is built from `resident/kit.tsx`; rules in `docs/RESIDENT_UX_BRIEF.md`)
- Four places: **Home · Services · Requests · Account**; the bell (top right) opens Notifications. A service app, not a social one: no feed, posts or composer.
- Phones: top bar with the logo (inner pages: "← Services" etc.) and the bell; bottom bar with the four places. Active place: navy icon (heavier stroke) and label, plus a short 3px bar on the top edge that slides between tabs. Badges sit on a fixed 24px icon box (top-right corner): green count of things ready to pick up on Requests, red count of new notifications on the bell.
- Desktop: one top bar, logo, then Home · Services · Requests as a text menu (active one underlined), bell and avatar menu on the right.
- Home: greeting, Needs your attention (ready / needs a fix), What do you need? (six services), In progress; Announcements headlines and pick-up hours beside it on desktop.
- Services: grouped lists (Request, Book, Get help, Barangay info) with a search box. Requests: segmented filter (All, Ongoing, Ready, Done) and one list whose rows open in place. Account: you, your things, Display switches, Help and info, Sign out.
- Kit: `Page`, `PageTitle` (26/30px), `Section` (cards, `flush` for lists), `ListRow` (64px rows), `IconCircle`, `Choice`, `FormActions`, `EmptyState`. Main buttons on resident pages are navy (`variant="brand"`).
- The barangay's name is not shown anywhere in the resident portal; only the printed certificate carries it.

**Admin**
- *Processing*: Overview · Document Requests · Complaints · Printing Requests · Court Reservations
- *Management*: Residents · Personnel · Services · Officials · Chatbot Knowledge
- *Insights*: Reports · Audit Logs

Suggested lucide icons (stroke width **1.8**): Dashboard/Overview `Home` · Documents `FileText` · Complaints `TriangleAlert` · Printing `Printer` · Court `CircleDot` (or `Volleyball`) · My Profile / Residents `User` / `Users` · Notifications `Bell` · Personnel `IdCard` · Services `LayoutGrid` · Officials `Landmark` · Chatbot Knowledge `MessageSquareText` · Reports `ChartColumn` · Audit Logs `ScrollText`. Use the same icon for the same concept everywhere.

### 4.3 Mobile (< 768px)

- **Header**: 68px tall, solid navy, padding 10px 16px. 40px white logo disc with navy initials, `eKapitan` bold white plus `Brgy. Sto. Angel, San Pablo City` 12px on the left, and a 44px **Menu** button (2px white border, radius 8) on the right. The menu opens the full sidebar nav as a drawer.
- **Bottom nav** (residents): fixed, 68px, white, 1px line top, 4 equal tabs **Home · Services · My Requests · Account**, 13px Inter 600 muted. The active tab gets navy text plus a 3px `primary` bar on its top edge (`box-shadow: inset 0 3px var(--color-primary)`).
- Content padding 16px. Leave 68px bottom padding so nothing hides behind the bottom nav.
- Tables become **stacked cards** on mobile (title + status pill on one row, reference / detail in muted text below).
- Buttons are full width on mobile unless they sit in a row of two.

Tablet (768–1023px): keep the desktop top bar and collapse the sidebar into the Menu drawer. The drawer slides in from the right (360ms, `ease-drawer`) and has Dark mode, Large text and Sign out at the bottom.

### 4.4 Settings, dark mode and accessibility

- **Settings page** (resident tab `settings`, `resident/SettingsView.tsx`): Appearance (Light, Dark, Match device, each with a small preview), Text size (Normal, Large 112.5%, Extra large 125%, with a live sample), Accessibility (Reduce motion, High contrast, Large text), Notifications (SMS, Email, Announcements). Changes apply immediately and are saved on this device (`context/PreferencesContext.tsx`, localStorage key `ekapitan:preferences`). In-app notifications always stay on.
- **How it works**: the provider sets classes on `<html>`: `dark`, `large-text` / `xlarge-text`, `reduce-motion`, `high-contrast`. `index.css` redefines the color tokens for `html.dark` and `html.high-contrast`, so **every component must use tokens** (`bg-surface`, `text-ink`, `border-line`…), never `bg-white`, grays or hex values; `text-white` only on navy or primary fills. Dark mode uses neutral charcoal surfaces (page #121417, cards #1C1F23, raised controls #272B30) with near-white text, like the dark modes residents know from their phones. Navy is split: `bg-navy` is a fill (a calm blue in dark, still 5.7:1 under white text), while **text, borders and focus rings use `navy-ink`** (`text-navy-ink`, `border-navy-ink`), which turns soft light blue in dark. Dialog, sheet and drawer backdrops use `bg-scrim/50` (black in dark), and text on gold fills uses `text-on-gold`. Never use `text-navy` / `border-navy` for text or lines, and never put `border-navy-ink` on a navy fill. Reduce motion collapses every animation and transition and sets Motion's `reducedMotion="always"`.
- The older Large text switches (account menu, public site) and the Text size setting stay in step.

---

## 5. Components

Class names below are Tailwind v4 with the tokens above. They are the reference implementation for the shared primitives.

### 5.1 Buttons

| Variant | Look | Use |
|---|---|---|
| **Primary** | `bg-primary text-white` | The main action on a screen or card (Continue, Submit, Approve, Sign in) |
| **Secondary** | `bg-surface text-navy border-2 border-navy` | Back, Previous/Next, Export, Decline, Return for correction |
| **Accent** | `bg-gold text-navy` | Only on a navy banner/card, max one per screen |
| **Danger** | `bg-danger-fg text-white` | Reject, delete |
| **Brand** | `bg-navy text-white` | Landing page and sign-in dialog main action (Sign up, Sign in, Create account) |
| **Outline** | `bg-surface text-navy border-hairline` | Landing page secondary action next to Brand |
| **Inverse / Inverse outline** | white on navy / white border | Buttons on a navy band (landing closing call to action) |

Shared: radius 10, Inter 600 16px, `min-h-12` (48px), horizontal padding 24px. The compact size (inside lists, calendars and toolbars) is `min-h-11` (44px) with padding 18px. **Never go below 44px.** Focus: 3px navy outline with 2px offset. Disabled: `surface-muted` background, `muted` text, no border change.

**Hover is unmistakable** (on devices that can hover; phones only get the press): filled buttons lift 1px, deepen their color and cast a soft shadow in their own hue; outlined buttons fill with `navy-tint` and their border turns navy. Press scales to 0.97 and drops the lift. Disabled buttons never react.

Button text is a plain verb phrase in sentence case: "Submit report", "Request a document", "Approve request".

### 5.2 Card

`bg-surface border border-line rounded-[16px] p-6`. Forms use `p-8`. Card header row (`.ch`) is a flex row with `justify-between items-center mb-3`: an `h3` on the left and an optional "View all" link (`text-primary-strong font-semibold`) or pill on the right.

Variants:
- **Callout card** (tips, claiming hours, how to claim): `bg-primary-tint border-primary-tint-line`.
- **Navy card** (estimated cost, highlight): `bg-navy border-navy`, white text, `on-navy` secondary text, gold accent button.
- **Welcome banner** (dashboard top): `bg-navy rounded-[20px] px-8 py-7`, flex `justify-between`, with white `h2` "Good day, {first name}", an `on-navy` sub-line, and a gold button on the right.

### 5.3 Status pill

`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold` with a **7px dot in `currentColor`** before the text, and colors from the tone table. Never use a pill without the dot, and never use color alone. The text always says the status.

**Status vocabulary.** Use these exact words and tones everywhere:

| Status text | Tone |
|---|---|
| Pending · Pending approval · Received (report waiting for staff) · Returned for correction | warning |
| Processing · Under review · Action taken · Hearing scheduled · Unassigned | info |
| Ready for pickup · Ready · Approved · Resolved · Available | success |
| Rejected · Declined · Booked · Closed · Cancelled | danger |
| Completed (already claimed / done, no action needed) · Not started | neutral |

How the data maps (already coded in `components/ui/StatusPill.tsx`):
- Document requests: `submitted` → Pending, `under_review` → Under review, `returned` → Returned for correction, `approved` → Approved, `ready_for_release` → Ready for pickup, `completed` → Completed, `rejected` → Rejected.
- Incident reports: `received` → Received, `assigned` → Under review, `in_progress` → Action taken, `hearing_scheduled` → Hearing scheduled, `resolved` → Resolved, `dismissed` → Closed.
- Appointments: `confirmed` → Approved, `rescheduled` → Pending, `completed` → Completed, `cancelled` → Cancelled.
- Court reservations (`courtStatus`): `pending` → Pending approval, `approved` → Approved, `declined` → Declined, `cancelled` → Cancelled, `completed` → Completed.
- Print requests (`printStatus`): `pending` → Pending, `processing` → Processing, `ready_for_pickup` → Ready for pickup, `completed` → Completed, `rejected` → Rejected.

In a progress timeline (5.12), reached stages use their tone and unreached stages use neutral.

### 5.4 Stat card

A card containing a muted label (15px), then the big number (Poppins 700 38px navy, `mt-2`). The admin variant puts a 52px icon tile above the label. Stat cards sit 3 or 4 per row with gap 20.

### 5.5 Icon tile

52px (mobile 40px) square, radius 14, centered 24px icon, colors from a tone pair: green (default), info (`n`), warning (`y`), danger (`r`). Used on stat cards, quick-action cards and requirement cards.

### 5.6 Form fields

- **Label** above the field: Inter 600 15px, ink, `mt-4 mb-1.5`. Always a real `<label htmlFor>`. Never use a placeholder as the label.
- **Input / select**: full width, `min-h-12`, padding `12px 14px`, `border-[1.5px] border-field-line rounded-[10px] bg-surface`, **16px text** (prevents iOS zoom). Focus: navy border plus 3px navy/20% ring.
- **Textarea**: same, min-height 120px (mobile 96px).
- **Help text** under a field: muted 15px, `mt-1.5` ("JPG, PNG or PDF, up to 5 MB.").
- **Error**: border `danger-fg`, message under the field in `danger-fg` 15px, starting with what to do ("Enter your mobile number").
- Two-column field grid on desktop: `grid grid-cols-2 gap-x-5`. One column on mobile.
- Form action row: `flex justify-between mt-7`, Secondary "Back" on the left and Primary on the right.

### 5.7 Table

- `w-full border-collapse`.
- `th`: left-aligned, 12px uppercase, letter-spacing .06em, muted, `py-2.5 px-2`, 2px `line` bottom border.
- `td`: `py-3.5 px-2`, 15px, 1px `line-soft` bottom border, no border on the last row.
- Reference numbers (`DOC-2026-0412`) are plain text in the first column. The **status pill goes in the last column**.
- Selected/active row: `bg-navy-tint`.
- Key-value detail tables (admin detail panel): the left cell is muted.
- On mobile, tables turn into stacked cards (section 4.3).

### 5.8 Page header

```
Documents / Barangay Clearance          ← optional breadcrumb, muted 15px
Request a Barangay Clearance            ← h1
Fill in your details. It takes about 3 minutes.   ← muted, mt-1
```
A flex row `justify-between items-end mb-6`. An optional Secondary action button sits on the right (Export report, Close a date).

### 5.9 Stepper (multi-step forms)

34px circles with 14px Inter 600 numbers, connected by 48px 2px `line` rules, each step label next to its circle. **Done** = `primary` circle with white number. **Current** = `navy` circle with white number and an ink label. **Upcoming** = `line` circle with a muted label.

### 5.10 Calendar

- 7-column grid, gap 8, weekday headers muted bold.
- Day cell: 52px tall (mobile 44px), radius 10, 1px line border, centered 600 weight.
- Day states: **past/unavailable** `neutral` · **available** `success` · **booked/closed** `danger` · **selected** solid navy with white text and a 3px navy outline. Always show a legend under the calendar with pills for each state.
- Admin calendar variant: taller cells (min 92px), date top-left, events as small 12px tone chips (`rounded-md px-1.5`) stacked inside the cell.

### 5.11 Time slot

A full-width button, flex `justify-between`, padding `12px 16px`, min-height 52, radius 12, 1.5px line border, Inter 600 15px, with a status pill on the right. **Selected**: navy border plus `navy-tint` background. **Unavailable**: `surface-muted` background, muted text, `disabled`.

### 5.12 Progress timeline (request / report tracking)

A vertical list, one row per stage: a status pill (the stage name) followed by muted detail text (date or "Assigned to barangay staff"). Reached stages use their tone. Unreached stages use **neutral**. Stages for reports are Received → Under review → Action taken → Resolved.

### 5.13 Filter bar (admin lists)

A card with a grid `2fr 1fr 1fr`, gap-x 16: Search input, Status select, Type select, each with a label above.

### 5.14 List + detail (admin processing screens)

Grid: `lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]`, so the detail panel never gets squeezed by a wide table. Inside narrow panels, key-value rows stack (label above value) using a container query: `<dl className="@container">` with rows `grid @[18rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`.


A grid `1.7fr 1fr`. The table on the left highlights the selected row with `navy-tint`. The detail card on the right holds the `h3` reference with its pill, a key-value table, any attachment preview (`line-soft` block), an "Assigned to" select, then **Primary approve (full width)**, then a 2-col row of **Secondary "Return for correction"** and **Danger "Reject"**.

### 5.15 Simple bar chart (overview)

Use the shared `BarChart` component (`components/ui/BarChart.tsx`); `orientation="horizontal"` for long category names (Reports), vertical for a few short ones (Overview). One series is **one color** (`primary`; color carries identity only when there are several series, and the category names sit under the columns). Columns are at most 24px wide with a 4px rounded top, square at the 1px baseline; the value sits **on top of** each column in text color (never the bar color); a hover tooltip shows the exact value; a visually hidden table gives screen readers every number. Keep charts this simple: no 3D, gradients, dual axes, or pie charts with more than 4 slices. Supersedes the mockup's alternating green/navy bars.

### 5.17 Toast pop-ups

Shared by every role (`layout/ToastContainer.tsx`); call `addToast(title, description, type)` from the context.
- White card (`bg-surface border-line rounded-card shadow-float`) with a 4px left edge and a round icon tile in the tone color (success / info / warning / error), plus a 44px dismiss button.
- Bottom-right on desktop (380px wide); full width above the bottom nav on phones.
- Errors are announced immediately (`role="alert"`), others politely (`role="status"`).
- Copy follows section 7: a short sentence-case title ("Request submitted"), then the next step ("Reference REQ-2026-1234. You can follow it in My Requests."). No Title Case, no "Successfully".

**Skeletons** (`layout/PageSkeleton.tsx`, `ui/Skeleton.tsx`): every page shows a skeleton shaped like itself while it loads: the same card shells, grids and spacing, with shimmering `Bone` blocks where text and controls go. `skeletonFor(tab)` maps each tab to one of the layouts in section 6 (dashboard, cards, form, list + detail, table, calendar, profile, feed, chat, admin overview, public home). A new page picks the closest one, or adds a layout. The very first load shows a static landing-shaped skeleton written in plain HTML/CSS in `frontend/index.html`, before the app's code arrives.

### 5.18 Certificate viewer and printed certificate

`shared/OfficialDocumentTemplate.tsx`, opened with `setSelectedDocumentForPrint(request)` from anywhere (resident or admin).
- **Screen:** white toolbar (document name, reference + resident, status pill, Primary "Print or save as PDF", 44px close) over a navy/60 backdrop; the certificate is an A4-proportioned white sheet. Escape or clicking outside closes it.
- **Print:** only the certificate prints (the app is hidden), on A4 with 16mm margins.
- **The certificate itself** is a formal document, so it stays mostly ink-on-white (navy only for the letterhead and title) and prints well in black and white: letterhead (Republic of the Philippines → Barangay Sto. Angel → Office of the Punong Barangay) over a double rule; a council column filled from the **Officials data**; title, reference, "To whom it may concern:", justified body per document type, "Issued this 9th day of …"; a blank signature line over the Punong Barangay's name; and a footer row (fee, O.R. no., validity, verification code) with "Not valid without the official barangay seal".
- **Never draw** a seal, logo, signature or fake QR. The dashed circles are placeholders for the real seals; signatures and the dry seal are applied by hand at the hall.

### 5.16 Notification item

A bold one-line title followed by a muted line with the next step ("Claim it with a valid ID."). The newest is first. Unread items get a 7px `primary` dot before the title.

---

## 6. Page layouts

Use one of these grids for the content area (gap 20, `items-start`):

| Pattern | Columns | Used by |
|---|---|---|
| Dashboard | Banner → 3 stat cards → `1.7fr 1fr` (recent requests table / notifications + callout) | Resident Dashboard |
| Form + aside | `1.6fr 1fr` (form card / requirements + how-to-claim callout) | Document request, Printing (`1.5fr 1fr` with the navy cost card) |
| Form + history | `1.2fr 1fr` (form card / my-items table + progress timeline) | Complaints & Reports |
| Picker | `1.4fr 1fr` (calendar / slots + details + submit), then a full-width history card | Court Reservation |
| Overview | 4 stat cards → `1.3fr 1fr` (chart / needs-attention) → full-width recent activity | Admin Overview |
| List + detail | Filter bar → `1.7fr 1fr` | Admin Document Requests, Complaints, Printing Requests |
| Calendar + queue | `1.8fr 1fr` (calendar / pending requests with Approve/Decline) | Admin Court Reservations |

Every service page ends with a **"My … history / My requests" table card** when the resident has past items.

All grids collapse to a single column below 1024px, in source order.

---

## 7. Content and voice

- Plain, warm, second person. "Need something from the barangay today?" "You will be notified once the barangay approves it."
- Tell people the **next step** and the **real-world fact** (hours, what to bring). "Bring your reference number and ID to the barangay hall, 1:00 PM to 4:00 PM. Any fee is paid at the hall."
- **No online payment language.** Fees are always "paid at the hall". Costs are "estimated" and are confirmed at pickup.
- Reference number format: `DOC-YYYY-NNNN`, `PRT-`, `CRT-`, `RPT-`.
- Dates: `Nov 26, 4:00 PM` in tables, `Thursday, November 26` in headings. Times as `4:00 PM to 6:00 PM` (words, not an en dash).
- **Tagline: "Your barangay, a tap away."** Use it as written (sentence case, comma, full stop) from `config/brand.ts`: landing hero, closing band, footer and the browser title. Don't write "Barangay services, online".
- Product names are fixed: **eKapitan** (one word, capital K, no hyphen) and **Ka-Barangay AI**. Buttons and nav items that open the assistant say **Ask Kap**; its page is titled "Ask Kap" and names Ka-Barangay AI in the description.
- **Account words, everywhere:** **Sign up** opens registration (header, hero, footer, public site, steps), **Sign in** opens sign-in, **Continue as guest** opens the public website, and **Sign out** ends a session. Inside the dialog the submit buttons are **Sign in** and **Create account**. Never "Log in", "Register", "Guest mode" or "Log out".
- **Button labels:** a short verb phrase in sentence case that says what happens: "Submit report", "Mark as released", "Reject request". No Title Case, no ampersand chains ("Close & Archive Case" → "Close case"), no internal jargon. The same action has the same label on every screen ("Add resident", "Reject" when the status it produces is "Rejected").
- Bilingual: every user-facing string must be translatable (English and Filipino). Don't bake text into images.
- Mock data must look real but be clearly mock. Don't invent official statistics.

---

## 8. Accessibility (WCAG 2.1 AA, senior-friendly)

- Touch targets ≥ 44px. Primary controls are 48px.
- Body text is 16px (15px on mobile) and inputs are 16px. Nothing is under 12px.
- All token pairs above meet AA contrast. Don't put `muted` text on `surface-muted` or on tinted callouts at sizes under 15px.
- Visible focus on every interactive element (3px navy outline, 2px offset). Never use `outline-none` without a replacement.
- Status is never shown by color alone. The pill always has words.
- Every icon-only button has an `aria-label`. Decorative icons get `aria-hidden`.
- Large text mode must keep working. Use rem sizes and don't fix heights on text containers.
- Respect `prefers-reduced-motion`. Motion stays subtle (≤ 200ms fades/slides) and is never required to understand the UI.
- **Motion tokens** (in `index.css`): `ease-out-strong` (cubic-bezier(0.23, 1, 0.32, 1)) for anything entering or responding to a press, `ease-drawer` for sheets. Never `ease-in`. Exits are faster than entrances.
- **Page changes**: the old page fades out (100ms), then the next page's skeleton fades in; when data is ready the page fades in and its top-level sections rise 10px with a short stagger (`.page-enter`, 0–140ms). Two full pages never cross-fade (too busy). Tabs show their skeleton for about 450ms (standing in for a real fetch).
- **Scroll reveal** (`ui/Reveal.tsx`): marketing-style pages (landing, public homepage) use the two-way `<Reveal>`: content rises in when it enters the viewport, eases out when it leaves, and comes back on the way back, entering from the side it is coming from. Built on CSS transitions so fast back-and-forth scrolling reverses smoothly. Don't use it on working screens (lists, forms), where content should simply be there.
- **Landing extras**: the logo draws itself once, the headline lines slide up from behind a mask, the example request plays its statuses (paused off screen), a reading-progress line runs under the header, step connectors draw in. Everything is static under reduced motion.
- **Press feedback**: every `Button` scales to 0.97 while pressed (150ms). Custom pressable elements should do the same (`active:scale-[0.97]`).
- **Dialogs**: centered on ≥ 640px (fade + scale from 0.96, 240ms in, 150ms out); a bottom sheet on phones (slide up, 420ms drawer curve). Lock page scroll, close on Escape and backdrop tap, make the page behind `inert`, and focus the panel, not the first field (that would pop the phone keyboard). Reference: `auth/AuthDialog.tsx`.
- **Mobile**: no tap highlight, `touch-action: manipulation` on controls, and no text selection on long-press of buttons (all in `index.css` base). Inputs stay at 16px so iOS never zooms.

---

## 9. Do and don't

**Do**
- Use tokens (`bg-navy`, `text-muted`, `border-line`) and the shared `components/ui` primitives.
- Use the cream `canvas` background behind everything and white cards on top.
- Keep one primary (green) action per card. Make secondary actions outlined navy.
- Copy layouts from section 6 and the closest mockup screen.

**Don't**
- Use Tailwind's default palettes (`slate-*`, `emerald-*`, `blue-*`, `rose-*`, `amber-*`). These are the old design.
- Hard-code hex colors, add new fonts, or use `text-[9px]`–`text-[11px]`.
- Use gradients, glass/blur, heavy shadows, or colored left-border "accent stripe" cards.
- Use more than one gold button per screen, or gold for anything except the hero/banner CTA and the logo.
- Use placeholder-as-label, icon-only buttons without labels, or status shown only by color.
- Fabricate a barangay seal or logo.

---

## 10. Ownership and workflow

| Area | Owner |
|---|---|
| Foundation: tokens, fonts, app shell, `components/ui/*`, this file | **ppen** |
| Resident: Dashboard, Documents, Complaints & Reports, Printing, Court Reservation, My Profile, Notifications | **ppen** |
| Admin: Processing, Management, Insights screens | teammates (assign names here) |

- Redesign **one screen per PR/branch**.
- Changes to tokens, the shell or `components/ui` go through ppen so everyone stays in sync. Update this file in the same PR.
- Before opening a PR, check your screen against section 9 and at 390px width.

---

## 11. Decisions on mockup inconsistencies

1. **Barangay name**: the mockup says "Sto. Anghel". The project docs (`PRODUCT.md`) say **"Sto. Angel"**. Use **Sto. Angel** until the team confirms otherwise.
2. **Calendar "Selected" legend**: the mockup legend shows a yellow pill, but the selected day is navy. **Selected = navy** everywhere. The legend shows a navy pill.
3. **Heading case**: the mockup mixes "Court Reservation" (Title Case) and "Document requests" (sentence case). **Page titles match their sidebar label (Title Case).** Card titles, buttons and messages use sentence case.
4. **Fonts**: Lexend/Outfit/JetBrains Mono in the current code are replaced by Inter + Poppins.
6. **Document request flow**: 3 steps as in the mockup (Choose → Your details → Review), then a confirmation that shows the reference number. Documents are claimed at the hall only. The old "Express counter" and "Certified digital copy" options were dropped to match the mockup.
7. **Residents only see their own reports.** The old Complaints screen listed every resident's reports. The new one shows only the signed-in resident's, and never staff-only fields like `internalNotes`.
5. **Resident nav "More" group (temporary)**: the new resident nav has no place yet for My Requests, Ka-Barangay AI, Appointments, Verify a Document, Advisories and Officials. They sit in a temporary third sidebar group called **More** until the team decides where they go. Don't copy this pattern for Admin.

---

## 12. Redesign status

| Screen | Status |
|---|---|
| Foundation: tokens, fonts, AppShell, `components/ui` | Done (ppen) |
| Resident · Dashboard | Done (ppen) |
| Resident · Documents (list + request form) | Done (ppen) |
| Resident · Complaints & Reports | Done (ppen) |
| Resident · Printing | Done (ppen). Printing is **free** for residents: never show a cost or fee for it. Data: `printRequests`, `createPrintRequest`, `updatePrintRequestStatus` in `BarangayContext` (Admin · Printing Requests can use these) |
| Resident · My Requests (More group) | Done (ppen), no mockup. One list of every request type with filters, search, and a detail panel (timeline, details, View certificate, Copy reference). |
| Resident · Court Reservation | Done (ppen). Data: `courtSlots`, `courtReservations`, `courtClosures`, `createCourtReservation`, `updateCourtReservationStatus`, `closeCourtDate` in `BarangayContext` (Admin · Court Reservations can use these: Approve/Decline and "Close a date"). Residents only ever see other people's bookings as "Booked", never names. |
| Resident · My Profile | Done (ppen), no mockup. Personal details are read-only (changed at the hall); mobile/email editable; change password; Large text and SMS preferences. |
| Resident · Notifications | Done (ppen), no mockup. Filter chips, unread dots, mark read on open, "Mark all as read". Read state: `readNotificationIds` / `markNotificationsRead` in `BarangayContext`. |
| Landing page + Sign in / Sign up | Done. No barangay named. Story: tagline + a hero that fills the first screen (with a Scroll to explore cue) and a layered **collage** showing several features at once (Documents in front; Court and Report tilted behind, drawn as simplified shapes so no text shows cut off; an Ask Kap reply and a text-message notice floating on top; rises in as one wave, drifts apart with scroll parallax, still under reduced motion; `auth/landing/HeroCollage.tsx`) → a **scroll-driven feature tour** (desktop: explanations scroll on the left while a pinned, enlarged preview switches to match and its rows rise in one after another; phones: each explanation followed by its preview) → **No account needed** (six wide action rows, each opening its page directly) → **Built for everyone** (pinned heading beside a compact two-column list) → how it works → FAQ (centred single column; each answer grows open and closed with a grid-rows height animation and a fade, in every browser) → sign-up band → footer. Feature copy and miniatures live in `auth/landing/features.tsx`. On phones and tablets a menu button in the header opens the page links, Sign in and Continue as guest. **Each action has one home per screen:** the hero holds Sign up and Continue as guest; the header holds Sign in (on phones, a "Sign in" link under the hero buttons instead), and the header's Sign up only slides in once the hero's has scrolled out of view; the closing band repeats Sign up and guest mode at the end of the page; the footer has no Get started column. Sign in / Sign up is a dialog (`auth/AuthDialog.tsx`): on tablets and desktop a navy brand side (what you get when signing in, the three sign-up steps with your progress) beside the form; on phones a bottom sheet with the form only. Sign up is two short steps (About you, then Password and ID) so it never becomes a long scroll; the dialog keeps one fixed size for every view (sign in, both sign-up steps, password recovery, done; the form scrolls inside if errors make it long); it rises in on open and sinks out on close; the tab indicator slides, views slide out the way you left and in from where you went, and the brand side cross-fades. Required fields carry a red asterisk (`Field required`, which also sets aria-required); placeholders show a real example ("e.g. 0917 123 4567"). Errors open their own row smoothly instead of jumping the form (`Expand` in `ui/Field.tsx`, used by every Field app-wide). Password fields use an eye / eye-off icon toggle. Demo login: any email or 09 mobile opens the resident view; "admin" opens the Administrator; "staff" or "captain"/"official" open the old roles. |
| Admin shell (demo `admin` role) | Done (ppen): Admin nav, top bar, mobile bottom nav (Overview · Requests · Calendar · More), phone header "eKapitan Admin / Administrator portal". |
| Admin · Overview | Done (ppen): 4 stat cards, Transactions by service chart, Needs attention (oldest first, click to open), Recent activity from the audit log, Export report (CSV). Phone: "Today at the barangay". |
| Admin · Document Requests | Done (ppen): filter bar (search, status, document) or search + chips on phones, list + detail with requirements, Assigned to, and actions by stage (Approve / Return for correction / Reject → Mark ready for pickup → Mark as claimed), Export list (CSV). Reference for every admin list + detail screen. |
| Admin · Complaints | Done (ppen), no dedicated mockup (follows Document Requests). Open reports first, list + detail with full history, staff-only note, and actions by stage (Assign → Record action taken / Schedule hearing → Mark as resolved, or Close without action). Every action asks for a message the resident will see. |
| Admin · Printing Requests | Done (ppen), no dedicated mockup. Queue summary in the header (jobs and sheets to print), status chips with counts, oldest job first, detail with big page/copy/sheet numbers and print settings, actions Start printing → Mark ready for pickup → Mark as picked up, or Don't accept (with reason). Never shows a cost other than "Free". |
| Admin · Residents | Done (ppen), no mockup. Masterlist with search, purok, group chips (Senior, PWD, Indigent, Voters, Household heads), inactive toggle; detail with household and requests; Add resident, Edit details (name/birthdate/sex locked), status changes; duplicate review (system suggests, a person decides, with a note). Opening a record is written to the audit log. Built for hundreds of residents: 25 per page, compact rows, multi-word search ("santos purok 2"), counts on every group chip, arrow-key browsing, and a details panel that stays in view. |
| Admin · Officials | Done (ppen), no mockup. In office / Former chips, sort by rank, add / edit, mark as former; only one Barangay Captain in office at a time. Feeds certificates and the public directory. |
| Admin · Chatbot Knowledge | Done (ppen), no mockup. Q&A entries by topic (counts), search, add / edit / remove (confirm); topics match regardless of capitals. Ka-Barangay AI answers only from these. |
| Admin · Reports | Done (ppen), no mockup. Stat cards + 6 count reports (documents by type and stage, complaints by concern and stage, residents by purok and age group) as horizontal bar charts, each downloadable as CSV, plus Download all. Counts only, no predictions. |
| Admin · Audit Logs | Done (ppen), no mockup. Read-only (can't edit or delete), search, category chips, 25 per page, newest first, detail panel, export of the shown entries. |
| Admin · Services | Done (ppen), no mockup. List of requestable documents (sortable), detail with fee, waiver, processing time, validity, requirements and request count; add / edit; Open to residents or Hidden (no delete). Changes show on the resident Documents page right away. |
| Admin · Personnel | Done (ppen), no mockup. Staff accounts with role presets (Administrator, Records staff, Front desk, Peace and order, Health worker, View only) plus per-area access, add / edit, on leave, deactivate (confirm). The last active administrator can't be demoted, put on leave or deactivated. "Assigned to" lists elsewhere come from here (`staffFor(area)`: active staff with that access). |
| Admin · Court Reservations | Done (ppen): calendar with booking chips (Approved / Pending / Closed), Pending requests numbered first come, first served with the request time, Approve / Decline (reason), selected-day schedule per slot, Close this day (cancels that day's bookings with the reason) / Reopen. Phone: "Court approvals" first, calendar below without chips. |
| Public site (guests): shell + Homepage | Done. Mockups "Public homepage" (desktop) and "Public · Homepage (mobile)". Shell in `layout/PublicShell.tsx`: navy-deep utility bar, top bar with Home · Services · Announcements · Officials · Contact · Ask Kap plus Log in / Register (full nav from 1280px; Menu drawer below), phone header + bottom nav Home · Services · My Requests · Account, contact footer on every page. |
| Public · Announcements, Track your request, Report a concern, How it works | Done, no mockup (built from these patterns). Track looks up any REQ/INC/PRT/CRT reference and shows status only, never names. |
| Officials directory (public + resident More group) | Done, styled like the homepage officials row. |
| Ka-Barangay AI (Ask Kap) | Done, no mockup. Titled "Ask Kap" for guests and "Ka-Barangay AI" for residents. Chat card + "Try asking" suggestions (a swipe row above the input on phones), "Information only" callout. |
| Verify a Document | Done, no mockup. Accepts the printed verification code (VER-…) only, not request reference numbers. Three results: valid, not issued yet, not found. |
| Old Staff and Official roles (legacy, demo login with "staff" / "captain") | Old layout. Colors, type sizes, weights, radii and shadows were moved onto the design tokens (no default Tailwind palette, gradients, glass or text under 12px), and button labels follow section 7. |

Update this table in the same PR as your screen.

Open questions, placeholders to confirm, and known follow-ups are tracked in **`REDESIGN_NOTES.md`** (in this `docs/` folder). Add to it when you make a guess or leave something unfinished.
