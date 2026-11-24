# Redesign notes: open questions and follow-ups

Things the team still needs to confirm or decide, collected while redesigning the Resident screens (ppen). Tick an item when it's settled, and write the answer next to it. Design rules live in `DESIGN.md`; this file covers only what's still open.

Legend: **Decide** = the team needs to choose · **Confirm** = we guessed or took it from the mockup, so check it's true · **Fix** = known gap or bug to come back to.

---

## Needs real barangay information (before the defense)

- [ ] **Confirm: barangay name spelling.** The mockup says "Sto. Anghel"; `PRODUCT.md` and the app use **"Sto. Angel"**. Check the official spelling.
  - Where: `BARANGAY` constant in `components/layout/AppShell.tsx` and `components/auth/LandingLogin.tsx`, plus `DESIGN.md` section 11.
- [ ] **Confirm: claiming hours.** "Weekdays, 1:00 PM to 4:00 PM at the Barangay Hall" is copied from the mockup. Is that the real release schedule?
  - Where: Dashboard (`citizen/CitizenHome.tsx`), Documents list and request form (`citizen/ServicesDirectory.tsx`, `citizen/DocumentRequestWizard.tsx`).
- [ ] **Confirm: court time slots.** 4–6 PM, 6–8 PM and 8–10 PM are from the mockup. Real slots and hours?
  - Where: `COURT_SLOTS` in `data/mockData.ts`.
- [ ] **Confirm: how far ahead residents can book the court.** Set to 60 days as a placeholder.
  - Where: `BOOKING_WINDOW_DAYS` at the top of `citizen/CourtReservationView.tsx`.
- [ ] **Fix: "Barangay 4A" still appears in mock data and old screens.** Examples: document descriptions ("resident of Barangay 4A…"), the QR verification message, the old header's hotline modal, verification codes (`VER-B4A-…`).
  - Where: `data/mockData.ts`, `context/BarangayContext.tsx`, older components.
- [ ] **Confirm: purok names.** The purok list ("Purok 1 - Centro", "Purok 2 - Riverside", …) dates from the Barangay 4A version. Replace with Sto. Angel's real puroks.
  - Where: `PUROKS` in `citizen/DocumentRequestWizard.tsx` and `citizen/ComplaintsView.tsx` (consider moving it to `mockData.ts` so there's one list).

## Navigation

- [ ] **Decide: where these resident features go.** They aren't in the new Resident nav, so they sit in a temporary **More** group at the bottom of the sidebar: My Requests, Ka-Barangay AI, Appointments, Verify a Document, Advisories, Officials. Options: fold some into existing pages (e.g. My Requests into the Dashboard's "View all"), make Ka-Barangay AI a floating chat button, or drop features.
  - Where: `citizen/residentNav.tsx`.
- [ ] **Decide: public homepage.** The mockup's login page has "Back to homepage", and the mockup includes a Public Homepage, but the app has none yet. For now the link became "Continue as guest". Who builds the homepage, and when?

## Documents

- [ ] **Decide: bring back the other release options?** To match the mockup, documents are claim-at-the-hall only. The old "Express counter queue" (instant queue ticket) and "Certified digital copy" options were removed. If wanted, they can come back as a choice on step 2.
- [ ] **Confirm: valid ID upload is required.** The mockup shows it as required, so a demo presenter needs an image or PDF on hand to get through the form. Make it optional for the demo?

## Complaints & Reports

- [ ] **Fix: reports filed with "Hide my name" can only be tracked until you leave the page.** The data stores them as "Anonymous Resident", so they can't be linked back to the resident later. Proper fix: keep the real reporter ID on the record but hide it from the people being reported.
  - Where: `createIncidentReport` in `context/BarangayContext.tsx`, `citizen/ComplaintsView.tsx`.
- [ ] **Confirm: report titles are generated.** The mockup's form has no title field, so each report is titled "Type: location" (e.g. "Public Safety / Streetlight: Near the chapel on Rizal St.") for staff screens. OK, or add a title field?

## Printing

- [x] ~~Print rates~~. **Decided: printing is free for residents.** No cost is shown anywhere, and the rate/cost fields were removed from the data.
- [ ] **Confirm: page counting.** For PDFs the page count fills in automatically (best effort). Word files and some PDFs need the resident to type it. Acceptable?

## Court Reservation

- [ ] **Decide: can residents cancel a request?** There's no cancel button yet. If yes, add "Cancel" to pending/approved items in My reservation history.
- [ ] **Note for the demo:** sample court bookings are generated relative to today's date, so the calendar always has upcoming bookings. Real data will replace this.

## Login and registration

- [ ] **Confirm: registering no longer logs you in.** Following the mockup ("Staff will verify your details before activating your account"), registration now shows a "waiting for verification" message. If the demo script relied on "register, then land on the dashboard", log in afterwards instead.
- [ ] **Note: demo login rules.** Any email or 09 mobile opens the resident view. An email containing "staff" or "captain"/"official" opens those roles. Passwords aren't checked (prototype only).
- [ ] **Note:** the old login page's marketing badges ("ARTA Compliant", "Barangay 4A", floating cards) were removed because the mockup has none.

## My Profile and Notifications (built without a mockup)

- [ ] **Review: team sign-off on the look.** Both pages were designed from `DESIGN.md` patterns because the mockup has no screens for them.
- [ ] **Confirm: which details residents may edit themselves.** Right now only mobile number and email. Name, birthdate, sex, civil status, address and purok are read-only, with "To correct these, visit the barangay hall with a valid ID."
- [ ] **Note: front-end only for now.** "Change password" validates and shows a success message but stores nothing. The SMS updates switch is remembered only until the page reloads. Both need the backend.
- [ ] **Note: where notifications come from.** They're generated from the status of each request (documents, reports, printing, court), not stored. A new status shows as a new unread notification. Read/unread resets on reload. Proper notifications (with SMS) need the backend.
  - Where: `citizen/useResidentActivity.ts`, `readNotificationIds` in `context/BarangayContext.tsx`.

## My Requests (built without a mockup)

- [ ] **Review: team sign-off on the look.** One page lists every request type (documents, reports, printing, court, appointments) with filter chips, search by reference, and a detail panel.
- [ ] **Decide: where My Requests lives in the nav.** It's in the temporary More group, but the mobile bottom nav and the Dashboard's "View all" already lead to it. Strong candidate to move into the Services group or Account.
- [ ] **Note: privacy fix.** The old tracker listed every resident's document requests (and let anyone search them by name). The new page shows only the signed-in resident's requests.
- [ ] **Note:** "View certificate" (approved, ready or claimed documents) still opens the old certificate preview (`common/OfficialDocumentTemplate.tsx`). It's a printable document, so it was left as is.

## Toasts and loading placeholder

- [x] ~~Toast pop-ups~~ restyled (all roles), and the page-loading skeleton recolored.
- [ ] **Note for Admin/Staff teammates:** your toast messages in `context/BarangayContext.tsx` still use Title Case ("Request Status Updated", "Ticket Marked as No Show"). Reword them in sentence case per `DESIGN.md` section 5.17 when you redesign your screens. The resident ones and the sign-in toast ("Welcome, Maria") are already updated.

## Code health

- [ ] **Fix: 12 TypeScript errors that existed before the redesign.** Duplicate keys, a duplicate `UserRole` type, and `incidentReports` / `dateReported` in `GuestReportStatus.tsx`. The app runs, but **`npm run build` fails** until they're fixed.
  - Check with: `npx tsc --noEmit` inside `frontend/`.
- [ ] **Note: uncommitted edits from before the redesign** (in `App.tsx`, `Header.tsx`, `AICitizenAssistant.tsx`, `DocumentVerification.tsx`, `OfficialDocumentTemplate.tsx`) are mixed in with the redesign work. Review them before committing.

## For Admin teammates (ready to use)

These data functions already exist in `BarangayContext`, so the Admin screens don't need new ones:

- **Printing Requests**: `printRequests`, `updatePrintRequestStatus(id, status, notes)`.
- **Court Reservations**: `courtReservations`, `courtClosures`, `updateCourtReservationStatus(id, status, notes)`, `closeCourtDate(date, reason)`. The `Calendar` component's `renderDayExtra` draws event chips in each day, as the admin court calendar mockup shows.
- **Shared components**: see `DESIGN.md` section 2 for the full list.
