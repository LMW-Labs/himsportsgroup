# Hyche International Management Sports Group — Owner Handoff Guide

## Your Website

**Live site:** https://himsportsgroup.com (once coming soon is removed)
**Staging / preview:** https://himsportsgroup.vercel.app/staging
**Admin — NIL Agreements:** https://himsportsgroup.com/nil-agreement

---

## NIL Agreement Portal — Step by Step

This is your most important tool. Use it every time a new athlete signs with you.

### Creating a signing link (your side)

1. Go to **himsportsgroup.com/nil-agreement**
2. You'll see a PIN entry screen — enter your admin PIN
3. Fill in:
   - **Athlete Full Name** — exactly as it should appear on the contract
   - **Effective Date** — the date the agreement starts
   - **Term** — 1 year or 2 years
4. Click **Generate Link**
5. Copy the link that appears and send it to the athlete (text, email, DM — whatever works)

### What the athlete sees

1. They open the link on their phone or computer
2. They read the full 17-section agreement (scrollable)
3. They enter their email address (optional — but they should, so they get a PDF copy)
4. They check the acknowledgment box
5. They sign using their finger (mobile) or mouse (desktop) — or type their name
6. They click **Sign & Submit**

### What happens after they sign

- Their signature, timestamp, and IP address are recorded in the database
- **You get an email** at chris@hycheims.com notifying you they signed
- **They get a confirmation email** with the signed PDF attached (if they provided their email)
- The portal shows a confirmation screen telling them you'll be in touch

### If something goes wrong

- **"Invalid Link"** — the token in the URL is wrong or already been used. Generate a new link from the admin panel.
- **"Incorrect PIN"** — double check your PIN. Contact your developer if you've forgotten it.
- **Athlete didn't get the email** — check their spam folder. Make sure they entered their email correctly before submitting.

---

## Contact Form Inquiries

When someone fills out the contact form at **himsportsgroup.com/contact**, their message is saved to your database. You can view all submissions in Supabase:

1. Go to https://supabase.com and sign in
2. Open the **himsportsgroup** project
3. Go to **Table Editor → inquiries**
4. All athlete, brand, and media inquiries are listed there with name, email, type, and message

---

## Adding News / Articles

The News page at **/news** pulls articles from your Supabase database.

To publish an article:
1. Go to https://supabase.com → your project → **Table Editor → articles**
2. Click **Insert Row**
3. Fill in:
   - `title` — article headline
   - `slug` — URL-friendly version (e.g. `halvine-dzellat-signs-nil-deal`)
   - `excerpt` — 1-2 sentence summary shown on the listing page
   - `body` — full article content (HTML is supported)
   - `author` — your name or staff name
   - `published_at` — date to display
   - `published` — set to `true` to make it live
   - `featured_image` — URL to an image (optional)
4. Save — the article appears on the site immediately

---

## Adding Athletes to the Database

The basketball roster at **/athletes/basketball** is hardcoded (update your developer to add/remove players).

Individual athlete profile pages at **/athletes/[name]** are database-driven. To add a profile:
1. Go to Supabase → **Table Editor → athletes**
2. Insert a row with:
   - `name` — full name
   - `slug` — URL version (e.g. `halvine-dzellat`)
   - `sport` — Basketball, Football, etc.
   - `position` — their position
   - `school` — current school or team
   - `bio` — athlete biography
   - `photo_url` — link to their photo
   - `published` — set to `true` to make the profile live

---

## Things Still Needed Before Full Public Launch

- [ ] **Phone number** — your real phone number needs to be added to the contact page (currently shows a placeholder). Tell your developer.
- [ ] **Coming Soon removed** — the homepage currently shows "Coming Soon." Your developer flips one switch to go live.
- [ ] **Logo** — the nav bar logo file (`gc-logo.png`) needs to be uploaded. Tell your developer which file to use.
- [ ] **Stats** — the numbers on the homepage (athletes represented, deal value, etc.) should reflect your real current numbers. Tell your developer what to update them to.

---

## Your Accounts & Access

| Service | What it's for | URL |
|---|---|---|
| Vercel | Hosts your website | https://vercel.com |
| Supabase | Your database (agreements, contacts, articles) | https://supabase.com |
| Resend | Sends your transactional emails | https://resend.com |
| GitHub | Stores your website code | https://github.com/LMW-Labs/himsportsgroup |

---

## Who to Contact for Changes

Any changes to the website design, pages, or features — contact your developer. Provide them with this file and the **CLAUDE.md** file in the project folder for full context.

For urgent issues with a signed agreement not appearing — check Supabase → `nil_agreements` table directly. Every signed agreement is stored there with the athlete's name, date, signature image, IP address, and timestamp.
