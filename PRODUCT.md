# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: **residents** of Barangay Sto. Angel, San Pablo City, Laguna, using the Citizen Portal to request documents, track requests, book appointments, file complaints and incident reports, and ask the AI assistant questions. They span all ages including senior citizens and PWDs, and most are likely on budget Android phones over unreliable data. When resident and staff needs conflict, residents win.

Secondary (all role-restricted via RBAC):
- Barangay staff and Secretary: process document requests, run the queue, maintain resident records, handle incident blotters.
- Barangay Captain and Kagawads (committee heads): confirm or change AI recommendations, read dashboards and forecasts.
- Administrator: accounts, officials directory, configuration.
- Guests (non-residents present in the barangay, no login): report incidents and view public information only.

## Product Purpose

e-Kapitan is a web-based barangay information management and decision-support system. It replaces paper logbooks and walk-in queues with centralized resident and household records, digitized services (documents, queue, appointments, complaints), and data-driven insight for planning. Success: fewer physical visits and shorter waits for residents, faster and more consistent service for staff, and officials who can plan staffing, health drives and peace-and-order programs from real data. It is a thesis project (single-barangay implementation and evaluation, Laguna College, San Pablo City).

## Positioning

One barangay-level platform that integrates what existing systems (LGUSS-BIMS, BALANGAY, Webyu, iPlan Gov, generic government chatbots) cover only in pieces. Its distinguishing mechanism: every automated feature is advisory and explainable (queue scores show how they were computed, assignments and duplicate flags await human confirmation), and the AI assistant answers only from the barangay's own configured knowledge base.

## Operating Context

- Deployment site: Barangay Sto. Angel, San Pablo City, Laguna. The barangay has non-residents, which is why Guest Mode exists.
- Used in the barangay hall by staff and from home or on the go by residents; desktop and mobile browsers (Chrome, Firefox, Edge). Internet required; no offline mode.
- Fees are settled through the barangay's existing manual payment procedure; there are no online payments.
- Printed certificates carry a QR code tied to a SHA-256 hash for record-matching verification.
- Current state: a working prototype (React + Vite frontend, Express backend with server-side Gemini calls) with a role switcher used for demos and the proposal defense.

## Capabilities and Constraints

- Modules: resident and household management with duplicate detection, smart document processing, intelligent queue, Citizen Portal, AI Citizen Assistant, complaint and incident management, decision-support dashboard, SMS/push alerts, Guest Mode, AI incident screening, AI-assisted task assignment, absence handling, officials directory, predictive analytics, administration and security.
- All automation is advisory. Never auto-merge, auto-delete, or auto-assign; humans keep final authority.
- Queue priority always shows its explanation. Weights, thresholds, keyword lists and role mappings are configuration, not hardcoded.
- PII is masked before any Gemini call; rule-based urgency must work when AI is down.
- Guest endpoints never expose resident data; guest reports are marked unverified. The public directory shows only consented fields.
- Resident-record access is written to a non-editable audit log. Aligned with the Data Privacy Act of 2012 (RA 10173).
- Out of scope: Katarungang Pambarangay mediation or adjudication, PSA/PhilSys/DILG integrations, online payments, native apps, offline mode, biometrics.
- Document verification is record matching, not anti-forgery. Forecasts are planning aids, not medical determinations.
- Full detail: `e-Kapitan_Project_Context.md`.

## Brand Commitments

Keep the names as they are: product **e-Kapitan** and the AI assistant **Ka-Barangay AI**, with current wording. No official Barangay Sto. Angel logo or seal is on hand yet; do not fabricate one.

## Evidence on Hand

- Thesis proposal content distilled in `e-Kapitan_Project_Context.md`, and a demo script in `prototype_presentation_guide.md`.
- Mock data only (`frontend/src/data/mockData.ts`). There are no real testimonials, resident counts, usage figures or official statistics; do not invent them. Population figures in the paper are still placeholders.

## Product Principles

1. Residents first: if a screen is hard for a senior citizen on a cheap phone, it is wrong.
2. Advisory, never autonomous: show what the system suggests and why, and make the human confirmation step obvious.
3. Explain every score and every refusal; no black boxes in front of residents or officials.
4. Protect residents' data by default: least privilege, masked AI calls, visible audit trail.
5. Work in the real barangay: bilingual, light on data, tolerant of weak connections, and consistent with how the hall actually operates.

## Accessibility & Inclusion

- Conform to WCAG 2.1 AA.
- Senior-friendly: large-text option (already in the prototype), generous touch targets, plain language.
- English and Filipino throughout the interface and AI assistant.
- Performance on low-end Android phones and weak or intermittent data.
