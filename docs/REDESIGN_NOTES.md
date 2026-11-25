# Redesign notes: open questions and follow-ups

Things the team still needs to confirm or decide, collected while redesigning the Resident screens (ppen). Tick an item when it's settled, and write the answer next to it. Design rules live in `DESIGN.md`; this file covers only what's still open.

Legend: **Decide** = the team needs to choose · **Confirm** = we guessed or took it from the mockup, so check it's true · **Fix** = known gap or bug to come back to.

---

## Needs real barangay information (before the defense)

- [ ] **Confirm: barangay name spelling.** The mockup says "Sto. Anghel"; `PRODUCT.md` and the app use **"Sto. Angel"**. Check the official spelling.
  - Where: `BARANGAY` in `frontend/src/config/barangay.ts` (the whole app reads it from there), plus `DESIGN.md` section 11.
- [ ] **Confirm: claiming hours.** "Weekdays, 1:00 PM to 4:00 PM at the Barangay Hall" is copied from the mockup. Is that the real release schedule?
  - Where: Dashboard (`resident/ResidentDashboard.tsx`), Documents list and request form (`resident/ServicesDirectory.tsx`, `resident/DocumentRequestWizard.tsx`).
- [ ] **Confirm: court time slots.** 4–6 PM, 6–8 PM and 8–10 PM are from the mockup. Real slots and hours?
  - Where: `COURT_SLOTS` in `data/mockData.ts`.
- [ ] **Confirm: how far ahead residents can book the court.** Set to 60 days as a placeholder.
  - Where: `BOOKING_WINDOW_DAYS` at the top of `resident/CourtReservationView.tsx`.
- [ ] **Fix: "Barangay 4A" still appears in mock data and old screens.** Examples: document descriptions ("resident of Barangay 4A…"), the QR verification message, the old header's hotline modal, verification codes (`VER-B4A-…`).
  - Where: `data/mockData.ts`, `context/BarangayContext.tsx`, older components.
- [ ] **Confirm: purok names.** The purok list ("Purok 1 - Centro", "Purok 2 - Riverside", …) dates from the Barangay 4A version. Replace with Sto. Angel's real puroks.
  - Where: `PUROKS` in `frontend/src/data/reference.ts` (one list for resident, public and admin screens).

## Navigation

- [ ] **Decide: where these resident features go.** They aren't in the new Resident nav, so they sit in a temporary **More** group at the bottom of the sidebar: My Requests, Ka-Barangay AI, Appointments, Verify a Document, Advisories, Officials. Options: fold some into existing pages (e.g. My Requests into the Dashboard's "View all"), make Ka-Barangay AI a floating chat button, or drop features.
  - Where: `resident/residentNav.tsx`.
- [x] ~~Public homepage~~. **Built** (`components/public/`). "Continue as guest" on the login page now opens it, and its Log in / Register buttons return to the login page (Register opens the registration card).

## Landing page

- [ ] **Confirm: wording is now "Sign in" / "Sign up"** (the old login page and public site said "Log in" / "Register"). Changed across the landing page, dialog and public site.
- [ ] **Confirm: the landing page names no barangay** (as requested); the header uses the e-Kapitan logo (`public/favicon.jpg`) instead of the `SA` monogram. The signed-in shells and the public site still show the barangay name.
- [ ] **Note: the example request on the landing page is illustrative** (marked "Example"). It shows an SMS "Your clearance is ready"; SMS isn't built yet (needs the backend).

## Public site (guests)

- [ ] **Confirm: official phone number and email.** The footer shows the mockup's placeholders "[Official phone number]" and "[Official email]".
  - Where: footer in `layout/PublicShell.tsx`.
- [ ] **Confirm: printing card copy.** The mockup says "see the estimated cost"; changed to "Free for residents" to match the printing decision.
- [ ] **Decide: what guests can track.** "Track your request" finds any document, report, printing or court reference and shows its status and dates only (no names). OK to show document/printing/court status to anyone who has the number?
- [ ] **Note: guest reports.** Name and mobile number are optional. Without a name the report is saved as "Anonymous Guest".
- [ ] **Note: "Request a document", "Send a print job" and "Reserve the court" open the login page** for guests, with a line under the service cards saying these are for registered residents.
- [x] ~~Ask Kap and Verify a document~~ restyled.
- [ ] **Confirm: Verify a document only accepts VER- codes.** It used to accept request reference numbers (REQ-…) too, which let anyone see a resident's name by guessing numbers. It also used to call a document "authentic" while it was still being processed; it now says "not issued yet".
- [ ] **Confirm: Ask Kap's offline answer.** If the AI service is down, Kap gives a fixed answer (clearance ₱50.00, indigency free, claiming 1:00 PM to 4:00 PM, office 8:00 AM to 5:00 PM). The old one listed a hotline, (02) 8642-1111, from the Barangay 4A version; it was removed until the real number is known.
- [ ] **Fix: the AI service's own answers may still mention Barangay 4A.** Those come from the backend (`backend/server.ts`), not the screen.
- [ ] **Note: "Try a sample code"** on Verify a document fills in a seeded demo code. Remove it when real data arrives.
- [ ] **Note: "My Requests" in the phone bottom nav** opens Track your request for guests, and "Account" opens the login page (mockup labels kept).

## Documents

- [ ] **Decide: bring back the other release options?** To match the mockup, documents are claim-at-the-hall only. The old "Express counter queue" (instant queue ticket) and "Certified digital copy" options were removed. If wanted, they can come back as a choice on step 2.
- [ ] **Confirm: valid ID upload is required.** The mockup shows it as required, so a demo presenter needs an image or PDF on hand to get through the form. Make it optional for the demo?

## Complaints & Reports

- [ ] **Fix: reports filed with "Hide my name" can only be tracked until you leave the page.** The data stores them as "Anonymous Resident", so they can't be linked back to the resident later. Proper fix: keep the real reporter ID on the record but hide it from the people being reported.
  - Where: `createIncidentReport` in `context/BarangayContext.tsx`, `resident/ComplaintsView.tsx`.
- [ ] **Confirm: report titles are generated.** The mockup's form has no title field, so each report is titled "Type: location" (e.g. "Public Safety / Streetlight: Near the chapel on Rizal St.") for staff screens. OK, or add a title field?

## Printing

- [x] ~~Print rates~~. **Decided: printing is free for residents.** No cost is shown anywhere, and the rate/cost fields were removed from the data.
- [ ] **Confirm: page counting.** For PDFs the page count fills in automatically (best effort). Word files and some PDFs need the resident to type it. Acceptable?

## Court Reservation

- [ ] **Decide: can residents cancel a request?** There's no cancel button yet. If yes, add "Cancel" to pending/approved items in My reservation history.
- [ ] **Note for the demo:** sample court bookings are generated relative to today's date, so the calendar always has upcoming bookings. Real data will replace this.

## Login and registration

- [ ] **Confirm: registering no longer logs you in.** Following the mockup ("Staff will verify your details before activating your account"), registration now shows a "waiting for verification" message. If the demo script relied on "register, then land on the dashboard", log in afterwards instead.
- [ ] **Note: demo login rules.** Any email or 09 mobile opens the resident view. An email containing **"admin"** (e.g. `admin@demo.test`) opens the demo Administrator; "staff" or "captain"/"official" open those old roles. Passwords aren't checked (prototype only). The real admin account comes with the database phase.
- [ ] **Note:** the old login page's marketing badges ("ARTA Compliant", "Barangay 4A", floating cards) were removed because the mockup has none.

## My Profile and Notifications (built without a mockup)

- [ ] **Review: team sign-off on the look.** Both pages were designed from `DESIGN.md` patterns because the mockup has no screens for them.
- [ ] **Confirm: which details residents may edit themselves.** Right now only mobile number and email. Name, birthdate, sex, civil status, address and purok are read-only, with "To correct these, visit the barangay hall with a valid ID."
- [ ] **Note: front-end only for now.** "Change password" validates and shows a success message but stores nothing. The SMS updates switch is remembered only until the page reloads. Both need the backend.
- [ ] **Note: where notifications come from.** They're generated from the status of each request (documents, reports, printing, court), not stored. A new status shows as a new unread notification. Read/unread resets on reload. Proper notifications (with SMS) need the backend.
  - Where: `resident/useResidentActivity.ts`, `readNotificationIds` in `context/BarangayContext.tsx`.

## My Requests (built without a mockup)

- [ ] **Review: team sign-off on the look.** One page lists every request type (documents, reports, printing, court, appointments) with filter chips, search by reference, and a detail panel.
- [ ] **Decide: where My Requests lives in the nav.** It's in the temporary More group, but the mobile bottom nav and the Dashboard's "View all" already lead to it. Strong candidate to move into the Services group or Account.
- [ ] **Note: privacy fix.** The old tracker listed every resident's document requests (and let anyone search them by name). The new page shows only the signed-in resident's requests.
- [ ] **Note:** "View certificate" (approved, ready or claimed documents) still opens the old certificate preview (`shared/OfficialDocumentTemplate.tsx`). It's a printable document, so it was left as is.

## Toasts and loading placeholder

- [x] ~~Toast pop-ups~~ restyled (all roles), and the page-loading skeleton recolored.
- [ ] **Note for Admin/Staff teammates:** your toast messages in `context/BarangayContext.tsx` still use Title Case ("Request Status Updated", "Ticket Marked as No Show"). Reword them in sentence case per `DESIGN.md` section 5.17 when you redesign your screens. The resident ones and the sign-in toast ("Welcome, Maria") are already updated.

## Code health

- [x] ~~TypeScript errors~~. **Fixed** during the folder cleanup: `npm run typecheck` shows 0 errors and `npm run build` passes.
- [ ] **Note: uncommitted edits from before the redesign** (in `App.tsx`, `Header.tsx`, `shared/KaBarangayAI.tsx`, `shared/DocumentVerification.tsx`, `shared/OfficialDocumentTemplate.tsx`) are mixed in with the redesign work. Review them before committing.

## Roles

- [ ] **Decide: what happens to the old Staff and Official roles.** The mockup has only Resident and Admin. A demo **Admin** role now exists in the new shell, and it reuses the old Staff/Official screens (Operations Desk, Document Queue, Blotter, Residents, Officials, Executive dashboard, Audit Trail) until they're redesigned. Merge Staff/Official into Admin with permissions per position, or keep them as separate roles with their own nav?

## Admin · Overview

- [ ] **Confirm: what the numbers count.** Desktop stat cards and the chart show **all-time totals** in the mock data; the phone version shows what's **waiting now** (new requests, open reports, print jobs in progress, pending court requests), as the mockups label them. Should desktop be "this month" instead? That needs real dates from the database.
- [ ] **Note: "Needs attention"** lists items nobody has acted on yet (new document requests, unassigned complaints, pending print and court requests), oldest first.
- [ ] **Note: Export report** downloads a CSV (totals + the needs-attention list). A formatted PDF report can come later if the barangay wants one.

## Admin · Document Requests

- [ ] **Confirm: the request workflow.** Pending → (assign staff → Under review) → Approved → Ready for pickup → Claimed, with "Returned for correction" (resident fixes something; shown in My Requests with the staff note) and Rejected (with a reason) as side exits. Does this match how the hall actually works?
- [ ] **Note: new status `returned`.** Added to the data so "Return for correction" is a real state, not a rejection. Residents see it in My Requests, their notifications, and the timeline.
- [ ] **Confirm: staff names.** The "Assigned to" list is placeholder names (`BARANGAY_STAFF` in `data/mockData.ts`). It should come from the Personnel screen / staff accounts later.
- [ ] **Note: no ID preview yet.** The detail panel shows where the uploaded valid ID will appear; it needs file storage (Supabase Storage) to work.
- [ ] **Note:** the old Staff role's "Document Queue" screen still exists for the Staff login; the Admin screen replaces it in the new shell.

## Admin · Officials, Chatbot Knowledge, Reports, Audit Logs

- [ ] **Review: team sign-off on all four** (no mockups; Admin list + detail pattern).
- [ ] **Officials: consent for the public directory.** PRODUCT.md says the public directory shows only consented fields. There's one "Public contact" field with a note to use office contacts; a per-field consent setting needs the database.
- [ ] **Chatbot Knowledge: fix sample answers** that still mention "Barangay 4A" and sample fees. The AI uses these words directly.
- [ ] **Reports: counts only.** Forecasts from PRODUCT.md (staffing, health drives) aren't built; they need real history. Reports cover all records; a date-range filter needs real dates from the database.
- [ ] **Audit Logs: exporting** the log is itself not logged yet (needs the server). Consider limiting export to administrators.
- [ ] **Note:** the old Official/Staff screens (Executive dashboard, Audit Trail, Manage Officials) still exist for those old demo logins; the Admin pages replace them in the new shell.

## Admin · Services

- [ ] **Confirm: real fees, requirements and processing times** for each document with the barangay (current values are sample data).
- [ ] **Note:** services are never deleted, only **hidden** from residents, so old requests keep their document name. New services use the general certificate wording until a template is written for them (see the Certificate section).
- [ ] **Note:** printing and court reservations are not "services" here; they have their own screens and are free.

## Admin · Personnel

- [ ] **Review: team sign-off on the look and the roles.** Roles are presets of access areas: Administrator (everything), Records staff (documents, printing, residents), Front desk (documents, complaints, printing, court), Peace and order (complaints), Health worker (residents), View only (reports). Single areas can be added or removed per person. Do these match the barangay's real jobs?
- [ ] **Needs the database: real accounts.** Access is shown and saved, but nothing enforces it yet: the demo login still decides the view by email ("admin", "staff"). Real sign-in, passwords and per-area permissions on the server come with the database phase.
- [ ] **Note: "Assigned to" lists now come from Personnel.** Document Requests offers active staff with document access; Complaints offers active staff with complaint access (plus Kagawads, Tanod, Lupon). Staff on leave or deactivated aren't offered. The old placeholder `BARANGAY_STAFF` list is gone.
- [ ] **Note: safety rule.** The only active administrator can't be demoted, put on leave or deactivated, so the barangay can't lock itself out.
- [ ] **Note:** Personnel are staff accounts; Officials (Captain, Kagawads) are a separate list. Someone like the Barangay Secretary can be in both.

## Admin · Residents

- [ ] **Review: team sign-off on the look.** No mockup; follows the admin list + detail pattern.
- [ ] **Confirm: what staff may edit.** Name, birthdate and sex are locked in the edit form ("correct with a supporting document at the hall"). Civil status, address, purok, contact, occupation and the PWD/voter/indigent flags can be edited. Senior status is automatic from age (60+).
- [ ] **Confirm: merging duplicates.** "Same person" keeps the older record and **archives** the newer one with a note ("Merged into B4A-…"); nothing is deleted. Request history is not moved between records yet.
- [ ] **Note: privacy.** Every time staff open a resident record, it's written to the audit log (RA 10173). In development mode React runs effects twice, so a view can appear twice in the log; a production build logs it once.
- [ ] **Note: no export.** The old screen had none and a full masterlist export is sensitive personal data, so none was added. If the barangay needs one, it should be limited to specific roles and logged.
- [ ] **Note: 300 demo residents.** `generateDemoResidents(300)` at the end of `data/mockData.ts` adds invented residents (fixed seed, same for everyone) so the screen can be tried at a realistic size. Remove that line when real records are loaded.
- [ ] **Note: at real scale the database should do the searching and paging** (e.g. 25 rows per request). The current page loads every resident in the browser, which is fine for hundreds but not for many thousands.
- [ ] **Fix: resident numbers** still use the old `B4A-` prefix (from Barangay 4A) in the mock data and for new residents.
- [ ] **Note: duplicate detection fix.** The old detector always claimed "Same purok" and a fixed 88% score; it now lists only the fields that really match and scores from them. It's still a simple rule (same last name + birthdate, or same mobile).
- [ ] **Note:** registrations from the login page's "Create account" aren't saved anywhere yet, so there's no "waiting for verification" list here; that needs the database.

## Admin · Court Reservations

- [ ] **Confirm: closing a day cancels its bookings.** "Close this day" cancels every pending and approved booking that day and sends the closing reason to those residents (they see "Court booking cancelled" in notifications). Reopening the day does **not** restore those bookings. Is that what the barangay wants?
- [ ] **Confirm: first come, first served.** Pending requests are numbered (#1, #2…) and ordered by when they were **requested**, with the request time shown on each. Since a slot can only be requested once, this decides who gets reviewed first, not who wins a slot. Should staff be *required* to handle them in that order?
- [ ] **Decide: can staff move a booking** to another slot instead of declining it? Not built.
- [ ] **Note:** Approve has no conflict check because residents can't request a slot that's already taken; if staff ever enter bookings directly, a check will be needed.
- [ ] **Note:** the admin can look back at past months (read-only) and up to 2 months ahead.

## Admin · Printing Requests

- [ ] **Review: team sign-off on the look.** No mockup; follows the admin list + detail pattern, with status chips instead of a status dropdown (only a few statuses).
- [ ] **Needs the database: opening the file.** Staff can't open the uploaded file yet; the detail panel says where it will appear once uploads are stored (Supabase Storage).
- [ ] **Confirm: limits.** Is there a daily page limit per resident, or content the barangay won't print? "Don't accept" asks for a reason the resident sees.
- [ ] **Note:** two pending sample jobs were added to the mock data (PRT-2026-0092, PRT-2026-0093) so the full flow can be demoed.

## Admin · Complaints

- [ ] **Review: team sign-off on the look.** There's no Admin Complaints mockup; it follows the Document Requests layout.
- [ ] **Confirm: the complaint workflow.** Received → Assign (Under review) → Record action taken / Schedule hearing (repeatable) → Mark as resolved, or Close without action. Each step needs a message, and **the resident sees it** in their report progress.
- [ ] **Note: privacy fix.** Status updates used to be copied into the staff-only notes (and vice versa). Now the public update and the **staff-only note** are separate; residents never see the staff note.
- [ ] **Confirm: who can be assigned.** The list is active Kagawads and the Captain (from Officials), the placeholder staff names, "Barangay Tanod" and "Lupon Tagapamayapa". Should it follow committees (e.g. noise → Peace and Order Kagawad)?
- [ ] **Note: out of scope reminder.** PRODUCT.md says Katarungang Pambarangay mediation itself is out of scope; "Schedule hearing" only records the date for the resident, it doesn't manage the case.
- [ ] **Note:** one new sample complaint (INC-2026-0315, unassigned streetlight) was added to the mock data so the full flow can be demoed.

## Certificate (View certificate)

- [ ] **Confirm: certificate wording with the barangay.** The body text for each document type is a reasonable standard wording, not the barangay's official template. Ask for a real issued sample of each document and match it.
- [ ] **Needs from the barangay: official seals.** The letterhead shows dashed "City seal" / "Barangay seal" placeholders. Replace them with the real seal images once the barangay provides them (PRODUCT.md: don't make one up).
- [ ] **Decide: real QR code.** The old certificate had a fake QR pattern; it was removed. The verification code is printed instead (residents can enter it under Verify a Document). A real, scannable QR needs a small library (e.g. `qrcode`) and should encode a verification link or hash.
- [ ] **Note:** the council list on the certificate comes from the Officials data, so updating an official there updates every certificate. The hall address and phone number were removed until real ones are provided.

## For Admin teammates (ready to use)

- **Log in as admin:** any email containing "admin", any password. The Admin nav, top bar and mobile nav are done (`components/admin/adminNav.tsx`). Replace your tab's component in `App.tsx` (search for `admin_`).

These data functions already exist in `BarangayContext`, so the Admin screens don't need new ones:

- **Printing Requests**: `printRequests`, `updatePrintRequestStatus(id, status, notes)`.
- **Court Reservations**: `courtReservations`, `courtClosures`, `updateCourtReservationStatus(id, status, notes)`, `closeCourtDate(date, reason)`. The `Calendar` component's `renderDayExtra` draws event chips in each day, as the admin court calendar mockup shows.
- **Shared components**: see `DESIGN.md` section 2 for the full list.
