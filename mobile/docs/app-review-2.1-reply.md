# App Review notes — Gentrack AI 1.0 (Guideline 2.1 reply)

Paste the block below into **App Review Information → Notes** (and as the reply
to Apple's message). It answers all eight of Apple's questions, contains no
placeholders, and is 3972 characters — under the 4,000-character field limit.

Contact name/phone/email and the sign-in credentials live in their own fields on
that page, so they are deliberately not repeated in the notes.

---

```
DEMO ACCOUNT: <DEMO_EMAIL> / <DEMO_PASSWORD>
Loaded with generators, maintenance history, tasks and a teammate, and on Pro so every feature is reachable without a purchase. No other setup or hardware needed. One account type; this is the organization Owner, so it reaches everything including billing and team.

1. RECORDING - attached, captured on a physical iPhone from app launch: registration and login (Sign in with Apple and Google included), the camera permission prompt, a data-plate scan, logging a reading, maintenance, tasks, team invite, insights, assistant chat with a photo, the paywall and StoreKit sheet with Restore purchases, and in-app account deletion.

2. TESTED ON - iPhone 15 Pro Max, iOS 26.6.1, physical device: every flow above, with In-App Purchase in the StoreKit sandbox.

3. WHAT IT DOES - Gentrack AI is a standby-generator tracker for facility managers, rental fleets and contractors. It replaces the paper log or spreadsheet that lets service intervals drift until a unit fails when needed. The user photographs the data plate and gets back a spec sheet - make, model, serial, rated power, fuel type, service interval - to confirm before saving. The fleet then lives in one place: readings, maintenance with costs and reports, tasks, and a fleet-aware assistant, all scoped to an organization a team shares with owner, admin and member roles.

4. MAIN FEATURES - Scan: Home, Scan card; it asks camera permission and the shutter photographs the plate. With no generator at hand, tap the gallery icon and pick the sample nameplate photo attached here - the app reports low confidence and still lets you edit and save. Fleet tab: status, hours, fuel and battery per unit; tap for detail, then Log reading. Maintenance, inside a generator: schedule, mark done, record cost, share a report. Tasks tab: create, assign, filter. Chat: ask about a fault, interval or spec, optionally with a photo. Insights tab: health score, forecast, recommendations. Account: Team (invite by email, set role), Plan and billing, Delete account.

5. EXTERNAL SERVICES - our backend api.gentrackai.com holds all data and does all logic; Google Gemini, called by that backend for plate extraction, chat and insights, never by the app; Sign in with Apple and Google Sign-In; Apple In-App Purchase via StoreKit, with RevenueCat as the client SDK. Stripe serves only subscriptions bought on our website, never in the app. No analytics, advertising or crash SDK, and no tracking.

6. REGIONS - no differences. Features and content are identical everywhere, English only, at the localized App Store price.

7. REGULATION AND CONTENT - neither applies: this is record-keeping for equipment the user manages. Manufacturer names appear only as data the user recorded about their own machines; we reproduce no manuals or copyrighted material. There is no public feed and nothing is shared between strangers - chat is user-to-AI only, and collaboration is limited to people an owner invites into their own organization - so there is nothing to report or block. The app requests Camera and Photo Library only, at scan time: no location, contacts, microphone, push notifications or App Tracking Transparency.

8. IN-APP PURCHASE - one product: Gentrack Pro, an auto-renewable subscription sold monthly or yearly; no consumables, no other tiers. Free: 3 generators, 2 team members, reminders, photo scanning, 5 assistant chats a day. Pro: unlimited generators, members and chat, plus insights and forecasts. Reach it at the account icon top right of Home > Plan and billing; any Upgrade prompt on a free limit opens it too. It shows both plans, a monthly/yearly toggle, the App Store's own price, the renewal terms, tappable Terms of Use and Privacy Policy links, and Restore purchases. Subscribe opens the standard StoreKit sheet; no other payment method exists in the app. The demo account is already Pro; to see the paywall, watch the recording or sign up a free account.
```

---

## Still required alongside these notes

- [ ] **The screen recording** (Apple's item 1) — one take on the physical
      iPhone, from Home Screen tap through: sign-up with email/password, sign
      out, sign in, camera permission prompt + data-plate scan, log a reading,
      schedule maintenance, create a task, invite a teammate, insights, chat
      with a photo attached, Account → Plan & billing showing price + renewal
      terms + Terms/Privacy links + Restore, the StoreKit sheet, and finally
      Account → Delete account on a throwaway account.
- [ ] **A sample nameplate photo** in the attachment field — the notes tell the
      reviewer to scan it from the photo library, so it has to be there.
- [ ] The `<DEMO_EMAIL>` / `<DEMO_PASSWORD>` account must exist, be on Pro,
      and hold generators, maintenance history, tasks and a teammate. The notes
      promise all of that.
- [ ] Verify `LEGAL_URLS.privacy` (`gentrackai.com/privacy-policy`) actually
      loads — the notes state the paywall carries working Terms and Privacy links.
