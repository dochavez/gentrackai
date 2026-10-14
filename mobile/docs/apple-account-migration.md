# Moving GentrackAI to a new Apple Developer account

**Path: re-create, not transfer.** Apple's App Transfer requires the app to have
*at least one version already released to the App Store*
([criteria](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria)).
GentrackAI has never been released, so transfer is unavailable — and unnecessary:
there are no ratings, reviews, installs, or paying subscribers to preserve.

Because we re-create rather than transfer, the bundle identifier changes:

| | old | new |
|---|---|---|
| iOS bundle ID | `com.thotsuya.gentrackai` | `com.gentrackai.app` |
| Android package | `com.thotsuya.gentrackai` | *unchanged — see note* |

> **Android is deliberately untouched.** The Apple move does not require it, and
> renaming the Play package means a new Play Console listing, a new Android OAuth
> client + SHA-1, and a new RevenueCat Android app. Do it as a separate decision.

The bundle ID is the hinge: it is the `aud` of the Sign in with Apple identity
token, the subject of the Google iOS OAuth client, the key of the RevenueCat app,
and half of the `appID` in the universal-links file. Everything below follows from
changing it.

---

## 1 — New Apple Developer account: prerequisites

- [ ] Apple Developer Program membership is **active** (an Organization account needs a D-U-N-S number; allow days, not hours).
- [ ] App Store Connect → **Business** → **Paid Applications Agreement** is signed, with banking and tax forms complete.
      Until this is *Active*, no in-app purchase is configurable or purchasable, and
      [`getStorePlans`](../src/services/billing/store-billing.ts) will throw
      *"The store isn't offering a subscription right now."*
- [ ] Your Apple ID has **Admin** or **App Manager** on the new team.

## 2 — Apple Developer portal (new team)

- [ ] **Identifiers → App IDs → new**, explicit, `com.gentrackai.app`.
      Enable capabilities: **Sign in with Apple**, **Associated Domains**.
      (In-App Purchase needs no toggle.)
- [ ] **Keys → new key**, enable **Sign in with Apple**, scope it to the new App ID.
      Download the `.p8` — **Apple allows exactly one download**. Record the **Key ID**.
- [ ] Record the new **Team ID** (10 characters, top-right of the portal).

## 3 — App Store Connect (new team)

- [ ] **Free the app name first.** In the *old* account, delete the unreleased app
      record (App Information → Delete App). This usually releases "GentrackAI" for
      re-use; if the new account still reports the name as taken, open a case with
      App Store Connect support.
- [ ] **Apps → new app** → iOS → bundle ID `com.gentrackai.app`, new SKU.
      Record the numeric **Apple ID** shown on App Information — that is `ascAppId`.
- [ ] Recreate the **subscription group** and both auto-renewable products,
      **re-using the identical product IDs** as the old account. RevenueCat offerings
      reference products by ID, so identical IDs mean no code change here.
- [ ] App Information → generate the **App-Specific Shared Secret**.
- [ ] **Users & Access → Integrations → In-App Purchase** → generate key, download `.p8`.
- [ ] **Users & Access → Integrations → App Store Connect API** → generate an
      App Manager key, download `.p8` (used by `eas submit`).
- [ ] **Sandbox → Test Accounts**: sandbox testers are per-account, so create fresh ones.

## 4 — Google Cloud Console (forced by the bundle-ID change)

The **Web** client ID is not bundle-scoped and stays as-is. The **iOS** one is.

- [ ] Create a new **OAuth 2.0 Client ID → iOS** with bundle ID `com.gentrackai.app`.
- [ ] Put the new client ID in `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — in `.env` **and**
      in all three `build.*.env` blocks of `eas.json`.
- [ ] Put its **reversed** form in `app.json`, under the
      `@react-native-google-signin/google-signin` plugin:
      `"iosUrlScheme": "com.googleusercontent.apps.<new-ios-client-id-without-suffix>"`.
      Leaving the old value here is a silent failure — Google Sign-In returns to a
      URL scheme the app no longer claims.

## 5 — RevenueCat

- [ ] Project → **Apps → add an Apple App Store app** with bundle ID `com.gentrackai.app`.
- [ ] Upload the **In-App Purchase `.p8` key** (step 3) and paste the
      **App-Specific Shared Secret**.
- [ ] Import/recreate the products and attach them to the **monthly** and **annual**
      packages of the *current* offering. `store-billing.ts` maps only
      `PACKAGE_TYPE.MONTHLY` and `PACKAGE_TYPE.ANNUAL`; anything else is ignored.
- [ ] Copy the new **public SDK key** (`appl_…`) into `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
      in `.env` and all three `eas.json` profiles.
- [ ] Confirm the **webhook** to the Laravel backend is attached to the new app and its
      authorization header matches what the backend expects.
- [ ] Archive the old iOS app entry only once the new build is verified.

## 6 — Backend (`api.gentrackai.com`)

These are the items that break silently in production if missed.

- [ ] **`/.well-known/apple-app-site-association`** — change the `appID` from
      `OLDTEAM.com.thotsuya.gentrackai` to `NEWTEAM.com.gentrackai.app`.
      Must be served as `application/json`, over HTTPS, with **no redirect**.
      Without this the `/reset-password` universal link stops opening the app and
      falls back to Safari.
- [ ] **Sign in with Apple verification** — the expected `aud` claim becomes
      `com.gentrackai.app`. Update `APPLE_CLIENT_ID`.
- [ ] **Apple token revocation** (required by guideline 5.1.1(v) for the account
      deletion flow, which exchanges `authorizationCode`) — update `APPLE_TEAM_ID`,
      `APPLE_KEY_ID`, and the `.p8` private key to the new team's.
- [ ] **Existing Apple-linked users**: the Apple `sub` is scoped to a developer team.
      Every `sub` stored under the old team is now dead — the same human signing in
      after the cutover arrives as a brand-new user. Clear those links (in practice:
      any TestFlight testers who used Sign in with Apple). This is exactly the data
      loss the official App Transfer + 60-day
      [transfer-identifier migration](https://developer.apple.com/documentation/technotes/tn3159-migrating-sign-in-with-apple-users-for-an-app-transfer)
      exists to prevent — and it is affordable here only because nothing shipped.

## 7 — EAS

The old distribution certificate and provisioning profile belong to the old team
and cannot be re-used. Reset, don't edit.

```bash
eas credentials -p ios
```

- [ ] Remove the old distribution certificate, provisioning profile, and push key.
- [ ] Sign in with the **new** Apple account so EAS regenerates them against the new Team ID.
- [ ] Add the submit target to `eas.json`:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "<new-apple-id-email>",
      "ascAppId": "<numeric App Store Connect app id>",
      "appleTeamId": "<new 10-char team id>"
    }
  }
}
```

- [ ] Build and submit:

```bash
eas build -p ios --profile production
```

## 8 — Old account cleanup

- [ ] Delete the old App Store Connect record (step 3) and, once the new build is live,
      the old App ID identifier.
- [ ] Cancel the old membership **only after** the new app is approved — losing portal
      access mid-migration means losing the ability to free the bundle ID or app name.

---

## Things that are simply gone

- **TestFlight** — builds, groups, and testers do not carry over. The first external
  build in the new account goes through a fresh Beta App Review.
- **Sign in with Apple identities** — see §6.
- **App Analytics history** — none to lose here, but worth knowing.
