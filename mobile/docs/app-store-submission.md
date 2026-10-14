# App Store submission — GentrackAI 1.0

Everything App Store Connect asks for, written out ready to paste, plus the
checks that decide whether 1.0 passes review. Copy is drawn from what the app
actually does (scan → fleet → maintenance → tasks → team → AI chat/insights),
so it will match what a reviewer sees.

Bundle ID `com.gentrackai.app` · version `1.0` · Copyright `<COPYRIGHT_OWNER>`

---

## 1 — Blockers to fix before you hit "Add for Review"

These are the four things most likely to get 1.0 rejected. The first two are
metadata; the last two are code.

- [ ] **Privacy Policy URL is required and has no field filled in yet.** App
      Store Connect will not accept the submission without a reachable URL
      (App Information → Privacy Policy URL). Publish `https://gentrackai.com/privacy`
      and make sure it loads before submitting. It must disclose that photos of
      generator nameplates and chat messages are sent to the backend and
      processed by a third-party AI model (Gemini).
- [ ] **Terms of Use (EULA) link.** With auto-renewable subscriptions, App
      Review expects a functional Terms of Use link. Either use Apple's standard
      EULA (`https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`)
      or host your own at `https://gentrackai.com/terms` and set it in
      App Information → License Agreement.
- [ ] **The paywall is missing guideline 3.1.2 disclosure.**
      [`upgrade-screen.tsx`](../src/features/billing/upgrade-screen.tsx) shows the
      price and the Restore path, but not: subscription *length* in words
      ("Billed monthly, auto-renews until cancelled"), nor tappable **Terms of
      Use** and **Privacy Policy** links. 3.1.2 requires all of these in the
      binary, on the purchase screen. This is the single most common rejection
      for subscription apps.
- [ ] **"By continuing you agree to our Terms & Privacy Policy" on the sign-in
      screen is plain text, not links** ([`auth-screen.tsx:151`](../src/features/auth/auth-screen.tsx:151)).
      Make both words open the real URLs.

Also decide now:

- [ ] **iPad.** `app.json` sets `ios.supportsTablet: true`, so App Store Connect
      will demand 13-inch iPad screenshots and a reviewer will test on iPad. If
      you have not verified the layouts there, set `supportsTablet: false` and
      ship iPhone-only for 1.0 — that is a one-line change and removes a whole
      class of rejection.

Already handled correctly (no action needed):

- Sign in with Apple is present alongside Google — guideline 4.8. ✅
- In-app account deletion exists on the Account screen — guideline 5.1.1(v). ✅
- Purchases go through StoreKit via RevenueCat, with **Restore purchases** — 3.1.1. ✅
- `ITSAppUsesNonExemptEncryption: false` is set, so export compliance is answered
  automatically at upload. ✅

---

## 2 — App Store listing copy

### Name (30 max)
```
Gentrack AI
```

### Subtitle (30 max) — 29 chars
```
Generator fleet & maintenance
```

Alternatives if you want a different emphasis:
- `Scan, track & service gensets` (29)
- `Standby generator log & care` (28)

### Promotional text (170 max — editable any time without a new build)
```
Scan a generator's nameplate and Gentrack fills in the spec sheet for you. Track run hours, fuel and service history across your whole fleet, with your team, in one app.
```

### Description (4,000 max)
```
Gentrack AI turns the nameplate on a generator into a complete, maintained record — and keeps your whole fleet in one place.

Point your camera at a generator's data plate. Gentrack reads the manufacturer, model number, serial number, rated power, fuel type, transfer switch and service interval, and fills in the spec sheet for you. Confirm the details and the unit joins your fleet. No typing a serial number off a greasy label ever again.

SCAN, DON'T TYPE
• Photograph a data plate and get a filled-in spec sheet back
• Review every extracted field before it is saved — you always have the last word
• Add a photo from your library instead, if the unit is somewhere you aren't

YOUR FLEET AT A GLANCE
• Every generator with a live status: running, needs care, or offline
• Run hours, fuel level and battery voltage, each stamped with how fresh the reading is
• Log a reading in seconds — fuel, hours or battery — with an optional note
• Fuel burn rate per running hour, so you know what a tank really gets you

MAINTENANCE THAT DOESN'T SLIP
• Schedule services with due dates and see what is done, due soon, or overdue
• Record what each service cost and build a real service history
• Pull a maintenance report over 3 months to 5 years: services performed, total paid, estimated savings
• Share or export the report for an owner, a client, or an insurer

WORK YOUR TEAM CAN SHARE
• Create tasks against any generator, with due dates and an assignee
• Filter by overdue, assigned to me, or unassigned so nothing is quietly dropped
• Invite your team by email with owner, admin and member roles
• Everyone works from the same fleet, the same history, the same next-up list

ASK THE ASSISTANT
• A built-in AI assistant that knows your fleet — ask about a fault, an interval, a spec
• Send a photo with your question when something looks wrong
• Straight answers about the machines you actually own, not generic search results

INSIGHTS AND FORECASTS
• A fleet health score with the reasoning behind it
• Weekly run-hours trend and a forward-looking forecast
• Prioritised recommendations, flagged by severity, on what to service next

WHO IT'S FOR
Facility and property managers with standby power. Rental and equipment fleets. Contractors, farms, clinics, data closets, marinas, and anyone responsible for machines that must start on the day they are needed.

PLANS
Gentrack is free to start: up to 3 generators, 2 team members, maintenance reminders, photo scanning, and 5 assistant chats a day.

Gentrack Pro unlocks unlimited generators, unlimited team members, unlimited assistant chat, and AI insights and forecasts. Pro is an auto-renewing subscription available monthly or yearly. Payment is charged to your Apple ID at confirmation of purchase. The subscription renews automatically unless it is cancelled at least 24 hours before the end of the current period, and your account is charged for renewal within 24 hours of the end of the period. You can manage or cancel your subscription in your device's Settings after purchase.

Terms of Use: https://gentrackai.com/terms
Privacy Policy: https://gentrackai.com/privacy
```

### Keywords (100 max, comma-separated, **no spaces after commas**) — 95 chars
```
generator,genset,standby,backup power,maintenance,service log,run hours,fleet,diesel,preventive
```
Do not repeat the app name or the category name — Apple already indexes those.

### URLs
| Field | Value |
|---|---|
| Support URL (required) | `https://gentrackai.com/contact` (already set) |
| Marketing URL (optional) | `https://gentrackai.com` |
| Privacy Policy URL (required) | `https://gentrackai.com/privacy` — **must be live** |

### What's New (first release)
Leave blank for 1.0 — App Store Connect only shows this field from 1.1 onward.
If it is presented anyway:
```
First release. Scan a generator's nameplate to register it, log fuel, run hours and battery, schedule and cost out maintenance, assign tasks to your team, and ask the built-in assistant about any machine in your fleet.
```

---

## 3 — Categories, rating, pricing

| Field | Answer |
|---|---|
| Primary category | **Business** |
| Secondary category | **Productivity** (or Utilities) |
| Price | Free (monetised by subscription) |
| Availability | All territories, unless you want to limit it |
| Age rating | **4+** |

Age-rating questionnaire — answer *None* to violence, sexual content, profanity,
horror, gambling, drugs, and contests. Two that need thought:

- **User-generated content / chat:** the assistant chat is between the user and
  an AI, and team invites are limited to an organisation you control — there is
  no open user-to-user messaging or public feed. Answer accordingly; it stays 4+.
- **Unrestricted web access:** No. The app has no in-app browser for arbitrary URLs.

Content rights: you do not use third-party content, so answer No.

---

## 4 — In-app purchases (must be submitted **with** the build)

Both auto-renewable products have to be attached to the 1.0 version and reviewed
alongside it, or Pro will be unpurchasable on launch day.

For the subscription group and each product, provide:

- **Subscription group display name:** `Gentrack Pro`
- **Reference name / display name (monthly):** `Gentrack Pro — Monthly`
- **Display name (yearly):** `Gentrack Pro — Yearly`
- **Description (both, 45 char display name / 45 char description limits apply to the display name and 45/45 fields — keep tight):**
  `Unlimited generators, team and AI insights.`
- **Review screenshot:** a screenshot of the in-app paywall (the Choose your plan
  screen). Required per product.
- **Pricing:** set monthly and yearly tiers; the yearly note shown in-app comes
  from your backend, so make sure the discount you advertise matches the store price.

Prerequisites that silently block everything:

- [ ] **Paid Applications Agreement active** with banking and tax complete. Until
      it is, [`getStorePlans`](../src/services/billing/store-billing.ts) throws
      *"The store isn't offering a subscription right now."* and the paywall shows
      a dead CTA — a guaranteed rejection.
- [ ] Product IDs in App Store Connect match the ones RevenueCat's offering
      references, and the offering is marked **current**.
- [ ] App-Specific Shared Secret generated and set in RevenueCat, plus the
      In-App Purchase key, so entitlements resolve.
- [ ] Sandbox tester created (they are per-account — see
      [apple-account-migration.md](apple-account-migration.md)).

---

## 5 — Screenshots

Required sizes for a 1.0 submission:

| Device | Size | Required? |
|---|---|---|
| iPhone 6.9" | 1320 × 2868 or 1290 × 2796 | **Yes** |
| iPad 13" | 2064 × 2752 or 2048 × 2732 | **Yes, while `supportsTablet: true`** |

Up to 10 per size; 3–6 is the practical sweet spot. Suggested order and captions:

1. **Scan screen, camera framing a data plate** — "Scan the plate. Skip the typing."
2. **Scan result sheet with extracted specs** — "Every spec, read for you."
3. **Fleet list with mixed statuses** — "Your whole fleet, at a glance."
4. **Generator detail with run hours / fuel / battery** — "Readings that stay current."
5. **Maintenance list with overdue and due-soon** — "Nothing slips past due."
6. **Insights with health score and forecast** — "Know what to service next." *(Pro)*
7. **Assistant chat** — "Ask about any machine you own."

Populate the demo org with realistic data first — an empty fleet screenshot
reads as an unfinished app, and reviewers compare screenshots against the build.

App Preview video is optional; skip it for 1.0.

---

## 6 — App Review Information

A reviewer cannot get past the sign-in screen without an account, so the demo
credentials are mandatory. Fill in:

| Field | Value |
|---|---|
| Sign-in required | **Yes** |
| Username | `<DEMO_EMAIL>` |
| Password | *(create a real, working account before submitting)* |
| Contact first / last name | <CONTACT_NAME> |
| Contact phone / email | *(a mailbox you actually watch during review)* |

**Notes to reviewer** (paste as-is, adjusting the account details):

```
Gentrack AI helps facility managers and equipment fleets track standby generators: registering them by photographing the data plate, logging run hours/fuel/battery, scheduling maintenance, assigning tasks to teammates, and asking an AI assistant about a specific machine.

DEMO ACCOUNT
Email: <DEMO_EMAIL>
Password: <password>
The account is pre-loaded with several generators, maintenance history and tasks, and is on the Pro plan so every feature is reachable without a purchase.

SCANNING A GENERATOR (camera)
Tap the scan card on Home. The screen asks for camera permission and shows a live camera; the shutter photographs a generator's data plate and the specs are extracted server-side. If no generator is available to photograph, tap the gallery icon on the same screen and choose any photo — the app will report low confidence and still let you review the fields. A sample nameplate photo is attached to this submission for that purpose.

SUBSCRIPTIONS
Account → Plan & billing opens the paywall (Choose your plan). Pro is an auto-renewable subscription, monthly or yearly, sold through StoreKit. "Restore purchases" is on the same screen. Subscriptions bought on the web (Stripe) are shown as managed elsewhere, and the app correctly refuses to take payment for them outside the store.

SIGN IN
Email/password, Sign in with Apple, and Google are all supported. Sign in with Apple is offered wherever Google is.

ACCOUNT DELETION
Account → Delete account permanently deletes the account and its data from within the app.
```

Attach a sample nameplate photo in the review attachment field — it removes the
one real obstacle a reviewer at a desk has.

---

## 7 — App Privacy (the nutrition label)

Answer the questionnaire as follows. Nothing here is used for tracking or
advertising, and there is no analytics or crash SDK in the build.

| Data type | Collected | Linked to identity | Purpose | Tracking |
|---|---|---|---|---|
| Name | Yes | Yes | App Functionality | No |
| Email address | Yes | Yes | App Functionality, Customer Support | No |
| User ID | Yes | Yes | App Functionality | No |
| Photos (generator nameplates, chat attachments) | Yes | Yes | App Functionality | No |
| Other User Content (chat messages, notes, task titles) | Yes | Yes | App Functionality | No |
| Purchase History | Yes | Yes | App Functionality | No |

- **Do you or your partners track users?** No.
- **Purchase History** is collected because RevenueCat/StoreKit reports the
  subscription state to your backend to unlock Pro.
- Photos and chat text leave the device: they go to `api.gentrackai.com` and the
  scan/insights pipeline passes them to a third-party AI provider. Say so in the
  privacy policy — this is exactly what the "Data Use and Sharing" section is for.

The two permission strings the reviewer sees are already written in `app.json`:

- Camera: *"Allow GenTrack to use the camera to scan generator labels."*
- Photos: *"Allow GenTrack to access your photos to upload a generator label."*

---

## 8 — Build and upload

```bash
eas build --platform ios --profile production
```

```bash
eas submit --platform ios --profile production
```

`eas.json` uses `appVersionSource: remote` with `autoIncrement` on the production
profile, so the build number takes care of itself. Confirm before building:

- [ ] `EXPO_PUBLIC_API_URL` points at production (`https://api.gentrackai.com` ✅)
- [ ] RevenueCat iOS key in the production profile matches the **new** Apple team's app
- [ ] The Google iOS OAuth client matches bundle ID `com.gentrackai.app`
- [ ] Sign in with Apple and Associated Domains capabilities are enabled on the App ID
- [ ] `applinks:api.gentrackai.com` resolves — the reset-password deep link depends on it

---

## 9 — Final pre-flight

- [ ] Privacy Policy URL live and filled in
- [ ] Terms of Use / License Agreement set
- [ ] Paywall shows subscription length + Terms + Privacy links (3.1.2)
- [ ] iPad screenshots supplied, or `supportsTablet` turned off
- [ ] Both IAP products attached to the 1.0 version, each with a review screenshot
- [ ] Paid Applications Agreement active
- [ ] Demo account created, logged into once, and loaded with sample data
- [ ] Description, keywords, subtitle, promo text pasted
- [ ] Screenshots uploaded for every required size
- [ ] Age rating questionnaire completed (4+)
- [ ] Build processed in TestFlight and selected on the version page
- [ ] Tested the full flow on a real device from a fresh install: sign up → scan →
      log reading → schedule maintenance → invite → paywall → restore → delete account
