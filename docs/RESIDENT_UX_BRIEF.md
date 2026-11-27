# Resident portal: brief

Shared brief for everyone working on resident pages (people and AI helpers). Read with docs/DESIGN.md.

## What eKapitan is
A **service app** for barangay residents: request documents, report problems, book the court,
visit the hall, print files, track all of it. It is **not** social media. Take only the familiar
basics from apps people use daily (a bottom tab bar, a back arrow, simple lists, big buttons) and
nothing social: no feed, no posts, no composer, no stories, no likes.

Users: residents of all ages, many on budget Android phones, not technical. A page must be
understood at a glance: one job per page, short words, little text.

## Build every page from the kit (`components/resident/kit.tsx`)
- `<Page>` (720px column; `wide` = 1040px when a side panel really helps) as the page root.
  Its direct children are the sections, in reading order (the app staggers them in).
- `<PageTitle title sub action>`: the only page heading. One short line under it at most.
- `<Section title action>`: every card. `flush` + `<List>` + `<ListRow>` for lists.
- `<ListRow icon title sub trailing onClick>`: every list item (64px tall, icon circle left,
  status or chevron right).
- `<IconCircle tone>`: every round icon (tones: navy, green, amber, red, blue, gray).
- `<Choice>` inside `role="radiogroup"` grids: every pick-one option (sizes, kinds, times).
- `<FormActions>`: the buttons at the end of a form (main button full width on phones).
- `<EmptyState>`: when a list is empty.
- Use `Field`, `Input`, `Select`, `Textarea`, `FileUpload`, `Switch`, `StatusPill`, `Button` from `components/ui`.
- Do not invent new card styles, title styles, chips or colours. No custom margins between
  sections (the Page gap does it). Everything left-aligned to the same edge.

## Less is more
- Remove anything that repeats what is already on the screen or in the nav.
- No paragraphs of help. One short line where it is needed. Extra detail goes behind a
  `<details>`-style "What to bring" / "How it works" toggle.
- No decorative badges, counters, step numbers or progress text unless they help decide something.
- At most one primary (navy) button per screen.

## Words
Short sentences, everyday words, talk to "you". Use these names:
| Instead of | Say |
|---|---|
| Complaints & Reports, incident, blotter | Report a problem |
| Court Reservation | Book the court |
| Appointments | Visit the hall |
| Advisories | Announcements |
| Verify a Document | Check a document |
| Processing time | Ready in |
| Requirements | What to bring |
| Reference number | Tracking number |
| Claim | Pick up |
Never show the barangay's name or city. Pick-up: weekdays, 1:00 PM to 4:00 PM, at the barangay hall.

## Navigation (tab ids for setActiveTab)
- Main tabs: `home`, `services`, `tracking` (Requests), `account`. The bell opens `notifications`.
- Inner pages (back arrow in the top bar on phones): `documents`, `request_wizard`, `complaints`,
  `printing`, `court`, `appointments`, `ai_assistant`, `qr_verify`, `announcements`,
  `officials_directory`, `profile`, `settings`, `notifications`.
- Pages do not need their own "Back" link.

## Account vs Settings
- **Account** is about the person: who they are (verified or not), their requests at a glance,
  Your profile (personal details and contact), Password & security (password, devices, privacy),
  two links into Settings that show what is set now, Help, and Sign out. No switches on it.
- Settings are two pages, each opened from its own row on Account:
  **Display & language** (`settings`: Language · Display (appearance, text size Small/Normal/
  Large, bold text) · Accessibility) and **Notifications** (`notify_settings`: send to / send me).
- **Legal** (Account): `privacy_policy`, `terms`, `privacy_notice` pages, all from
  `components/legal/legalDocs.ts`. The landing footer and the sign-up consent checkbox open the
  same text in a sheet (`LegalSheet`). The text is a DRAFT: the barangay's Data Protection
  Officer must review it and add their contact details before launch. It stays in English.
- **Developer → Sample data** (Display & language, only under `npm run dev`, stripped from
  builds): off empties requests, reports, bookings and announcements to show a brand-new account.
- Services search is fuzzy (typos and half-words, English and Filipino keywords, `lib/fuzzy.ts`)
  and debounced (180 ms, `lib/useDebouncedValue.ts`); results are one list, best match first.
- Each thing lives in one place: contact is only on Your profile, password only on Password &
  security, barangay pages and Ask Kap only on Services.
- Whole-page preferences morph, never cross-fade: text size glides the root font size (all rem
  sizes follow), bold text glides the weight (Inter is loaded as a variable font), colors glide,
  and a language change stretches each visible card to its new size (view transition). Call
  `setPref(key, value, anchor)` with the tapped group as `anchor` so it stays under the finger.
- Give a radiogroup's `Choice`s a shared `group` name so the selection slides between them;
  add `tile` for three-across rows so long words (Filipino, large text) never collide.

## Guest mode
Guests ("Continue as guest") use the same frame and pages as residents (`ResidentShell guest`),
with places Home · Services · Ask Kap · Track · Account and Sign in / Sign up instead of the bell.
- Guest-only pages (`components/guest/`): `GuestHome`, `GuestTrack` (look up any tracking
  number; this visit's numbers stay in "Recently checked"), `GuestAccount`.
- Open to guests: report a problem (optional name and mobile), check a document, Ask Kap,
  announcements, officials, help, Display & language, legal pages.
- Needs an account: the tabs in `LOCKED_FOR_GUESTS` (`guest/access.ts`). They show a lock in
  Services and open `LockedView`, a "Sign up to …" page. Add a tab there when a new page needs
  an account. `useGuest()` gives `isGuest`, `signUp`, `signIn`, `leave`.
- The old public site (PublicShell, PublicHomepage, ReportConcern, TrackRequest, HowItWorks) is
  gone; old tab names still work through `GUEST_ALIAS`.

## Loading skeletons
Every resident page has its own skeleton in `components/layout/residentSkeletons.tsx`, built
from the same measurements as the kit (card corners, 64px rows, title sizes), and mapped by tab
id in `PageSkeleton.tsx` (`BY_TAB`). When you change a page's blocks, change its skeleton too.
A new resident page needs a skeleton and a `BY_TAB` entry; unknown tabs fall back to a generic form.

## Filipino (Settings → Language)
- Every word a resident sees goes through `t()`: `const t = useT()` from `src/i18n`, then
  `t('Requests')` or `t('Back to {page}', { page })`. The English text is the key.
- Add the Filipino in `src/i18n/fil/*.ts` (`'English': 'Filipino'`). Missing phrases show in
  English, so nothing breaks. `shell.ts` loads last and wins when two files disagree.
- Do not translate data from the barangay (names, notes, document types from the API), or
  text sent to the API (Ask Kap sends English; only the display is translated).
- Not translated yet: report stage labels (`buildReportStages`) and admin/staff pages.

## Returned requests
A request staff send back shows "What to fix:" with their note and a "Fix and resend" button
(`ReturnedFixSheet.tsx`). It calls `resubmitDocumentRequest` in `BarangayContext` (app state
only for now, no backend call). Try it with Maria's REQ-2026-0831.

## Tests
`npm test` (Vitest + Testing Library, jsdom). Covers the navigation model, translations and
five resident flows: sign in, Back returns where you came from, fix and resend, Filipino, and
the guided tour. Add a flow test in `src/test/residentFlows.test.tsx` when you add a main flow.

## Colours
Tokens only (bg-surface, bg-canvas, bg-surface-muted, text-ink, text-muted, border-line,
bg-navy fill, text-navy-ink / border-navy-ink for navy text and lines, status pairs).
Never bg-white, grays, hex, or text-navy. Dark mode depends on it.
