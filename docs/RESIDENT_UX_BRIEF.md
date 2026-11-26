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

## Colours
Tokens only (bg-surface, bg-canvas, bg-surface-muted, text-ink, text-muted, border-line,
bg-navy fill, text-navy-ink / border-navy-ink for navy text and lines, status pairs).
Never bg-white, grays, hex, or text-navy. Dark mode depends on it.
