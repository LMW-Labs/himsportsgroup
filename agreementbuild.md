I have an existing Astro site for Hyche International Management Sports Group hosted on Vercel. I need to add a NIL agreement signing page.

## Task
Build a new page at /nil-agreement that allows:
1. Admin view (Chris) — enter athlete name + effective date, then generate a shareable link
2. Athlete view — loads the pre-filled agreement, signs via canvas, submits

## Tech Stack
- Astro (existing site)
- Supabase: https://yuzwbglugboymetybbkh.supabase.co
- Use env vars: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY
- Vercel deployment

## Supabase Table to Create
Table: nil_agreements
Columns:
- id (uuid, primary key, default gen_random_uuid())
- athlete_name (text)
- effective_date (date)
- signed_at (timestamp)
- ip_address (text)
- signature_data (text) — base64 canvas image
- agreement_url_token (uuid) — unique token for the signing link
- status (text) — 'pending' or 'signed'
- created_at (timestamp, default now())

## Agreement Content
Exclusive NIL Representation Agreement between the athlete and:
- Agent: Christopher Hyche
- Agency: Hyche International Management Sports Group
- Compensation: 20% of gross NIL deals
- Term: 1 year (default, selectable)
- Governed by laws of the State of Mississippi

Include all 17 sections from this agreement verbatim:
1. Purpose and Scope of Representation
2. Express Limitation to Preserve Eligibility (Agent shall NOT negotiate professional contracts, professional teams, draft prep, athletic performance agreements, or compensation tied to professional contracts)
3. No Professional Representation
4. Exclusive NIL Representation
5. Term (1 year default, option for 2 years)
6. Compensation (20% of gross, not tied to athletic performance, playing contracts, or professional drafts)
7. Athlete Approval Required
8. Compliance with Laws and Institutional Policies
9. No Inducements
10. Independent Contractor Status
11. Conflict of Interest
12. Termination (30 days written notice, immediate for material breach, immediate for eligibility)
13. No Guarantee of Compensation
14. Governing Law (Mississippi)
15. Entire Agreement
16. Eligibility Protection Clause
17. Acknowledgment

## Admin Flow
- Route: /nil-agreement?admin=true
- Password protect with a simple hardcoded PIN (env var: ADMIN_PIN)
- Form: athlete name, effective date, term (1yr or 2yr)
- On submit: insert row to Supabase with status='pending', generate signing link
- Display the signing link for Chris to copy and send

## Athlete Signing Flow
- Route: /nil-agreement?token=[uuid]
- Load agreement pre-filled with athlete name and date from Supabase
- Show full agreement text (scrollable)
- Checkbox: "I have read and agree to this agreement"
- Signature canvas (draw or type toggle)
- On submit: save signature_data, signed_at, ip_address to Supabase, update status to 'signed'
- Show confirmation screen with download link for PDF copy

## PDF Generation
Use jsPDF (client-side) to generate a PDF copy of the signed agreement including:
- All agreement text
- Athlete name, date, agent name
- Signature image embedded
- Timestamp and IP logged at bottom

## Email
Use Resend API (env var: RESEND_API_KEY) to:
- Send Chris a notification when athlete signs (include athlete name, timestamp, link to view)
- Send athlete a confirmation email with PDF attached
- Chris's notification email: use env var ADMIN_EMAIL

## Styling
Match the existing site styles. If no styles are detectable, use a clean professional dark theme with gold accents appropriate for a sports management agency.

## Environment Variables Needed
PUBLIC_SUPABASE_URL=https://yuzwbglugboymetybbkh.supabase.co
PUBLIC_SUPABASE_ANON_KEY=[to be filled]
ADMIN_PIN=[to be filled]
ADMIN_EMAIL=[to be filled]
RESEND_API_KEY=[to be filled]