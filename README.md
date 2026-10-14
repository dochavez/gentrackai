# GentrackAI

**Smart maintenance for standby generators: from a photo of the nameplate to a complete maintenance plan.**

GentrackAI is a cross-platform mobile app (iOS, Android and web) backed by a Laravel API. It helps homeowners, facility managers and service companies keep their backup generators ready for the moment they matter most: a power outage.

---

## The problem

In areas exposed to hurricanes, storms, heat waves and freezes, such as the Texas Gulf Coast, a standby generator is essential equipment. When Hurricane Beryl hit Houston in July 2024, more than 2 million customers lost power, many of them for over a week.

The problem is what happens after the generator is installed: **people forget about it**. A unit can sit idle for months while the oil breaks down, the battery drains, filters clog and fuel goes stale. Nobody notices until the storm arrives and the generator doesn't start. Many owners don't know the model, the service interval or when the unit was last serviced.

On the service side, demand spikes every hurricane season and the few qualified technicians in the area are booked for weeks.

GentrackAI closes that gap. Anyone can point a phone at their generator and instantly know what it is, what it needs and when it needs it, with reminders **before** storm season. It also connects owners directly with local technicians.

> **Goal:** when the next storm makes landfall, every generator should start on the first try.

---

## What GentrackAI does

| Feature | Description |
|---|---|
| 📷 **AI nameplate scanning** | Take a photo of the generator's nameplate and a vision model (Google Gemini with JSON Schema structured output) extracts the manufacturer, model, serial number, rated power, fuel type, transfer switch rating and service interval, along with a confidence score. It handles angled, glare-heavy and partially legible labels, and it **never invents values**: anything it can't read comes back as `null`. |
| ⏱️ **Usage-based maintenance, no sensors required** | A projection engine estimates run hours and fuel use in real time. When a technician logs a real reading, the estimate is corrected and the schedule adjusts to how the unit is actually used. |
| 💬 **A fleet-aware AI assistant** | The "GenTrack AI" chat answers questions about *your* generators using **tool calling, not RAG**. It queries live, permission-scoped data (`list_generators`, `get_generator`, `list_maintenance`, `list_open_tasks`, `fleet_analytics`). It also accepts photos of fault codes or nameplates. |
| 📈 **Predictive insights** | A fleet health score, 4-week run-hour trends, a 30-day forecast and up to three prioritized recommendations (`info` / `warning` / `critical`) that take seasonality into account. |
| 👥 **Teams and fleets** | Multiple organizations per user, roles, invitations, task assignment and automatic daily reminders (in-app and by email) for whoever is responsible for each service. |
| 🛠️ **Maintenance marketplace** | Owners post a service request. Technicians whose service area covers that U.S. state are notified and submit offers, the job is scheduled, and it is rated once done. Technicians manage everything from a dedicated **Technician Panel**. |
| 📄 **Audit-ready reports** | PDF maintenance reports covering 3 months up to 5 years, with costs paid and estimated savings from preventive care. Useful for insurance, warranties or a property sale. |
| 💳 **Subscriptions** | Free and Pro plans per organization, plus a technician plan. In-app purchases on iOS/Android (RevenueCat) and web payments through Stripe, unified into a single entitlement model. |

**Who it's for:** homeowners with a backup generator, facility managers responsible for dozens of units, and service companies running their whole operation.

---

## Repository structure

```
gentrackai/
├── api/        Backend: Laravel 12 (PHP 8.2+), REST API with Sanctum
└── mobile/     App: React Native + Expo (iOS, Android and web), TypeScript
```

### `api/`: Backend (Laravel 12)

- **Authentication:** email/password, Google Sign-In and Sign in with Apple, with server-side token verification. The Apple token is revoked when an account is deleted.
- **Architecture:** single-action controllers, Form Requests, API Resources and domain services (`GeneratorLabelExtractor`, `GeneratorUsage`, `FleetAnalytics`, `InsightGenerator`, `ChatAssistant`, `PlanGate`, `TechnicianGate`, `StoreEntitlements`, `MaintenanceReport`).
- **AI (Gemini via Prism PHP):** OCR with a typed schema, exponential backoff with jitter for transient errors only (429/5xx), a fallback model, and a chat assistant whose tools are scoped to the user's organization and role.
- **Efficient insights:** a SHA-1 digest of the fleet state decides whether recommendations need to be regenerated. Generation runs in a queued job without overlap, and token usage is logged.
- **Payments:** Laravel Cashier (Stripe) for the web and RevenueCat (webhook plus immediate sync) for the app stores, with a single idempotent entitlement writer.
- **Scheduled jobs:** a daily insights refresh and maintenance reminders at 08:00.
- **Tests:** ~200 PHPUnit tests covering authentication, scanning, readings, insights, chat, organizations, the marketplace, the technician panel and billing.

### `mobile/`: App (React Native + Expo)

- **Expo SDK 56, React Native 0.85, React 19 and TypeScript**, organized by feature (`generators`, `maintenance`, `chat`, `insights`, `tasks`, `team`, `billing`, `technician`, `maintenance-requests`…).
- **Expo Router** with 35+ screens across two experiences: the owner app (Home, Fleet, Tasks, Insights) and the **Technician Panel**.
- **State and data:** Redux Toolkit (session), SWR (server data), Axios, Formik + Yup.
- **Camera scanning:** `expo-camera` with flash control and a gallery fallback. Photos are resized and normalized on the device (JPEG, ~200–400 KB) before upload.
- **Security:** the auth token is stored in the iOS Keychain / Android Keystore with `expo-secure-store`.
- **UI:** React Native Paper (light and dark mode), Reanimated, custom SVG icons and charts, Markdown rendering for AI replies, and shareable PDF reports.
- **Builds:** EAS Build (development, preview and production profiles).

---

## Getting started

### Requirements

- PHP 8.2+, Composer, Node.js 20+
- A database (SQLite by default in development, MySQL in production)
- Accounts/keys for the external services you plan to use: Google Gemini, Google OAuth, Apple Developer, Stripe and RevenueCat

### Backend

```bash
cd api
composer install
cp .env.example .env          # fill in your own credentials
php artisan key:generate
php artisan migrate
php artisan serve
php artisan queue:work         # in another terminal (insight generation)
php artisan test               # run the test suite
```

### Mobile app

```bash
cd mobile
npm install
cp .env.example .env          # fill in your own public keys
npx expo start
```

For **EAS** builds, set the `EXPO_PUBLIC_*` variables as *EAS environment variables* (the `.env` file is not uploaded to EAS). In `app.json`, replace `YOUR_GOOGLE_IOS_CLIENT_ID` and `YOUR_EAS_PROJECT_ID` with your own values.

---

## Security and configuration

This repository **contains no credentials**. All sensitive values are configured through environment variables:

| Where | Variables |
|---|---|
| `api/.env` | `APP_KEY`, `DB_*`, `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_SECRET`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `IOS_APP_ID`, `ANDROID_SHA256_FINGERPRINTS` |
| `mobile/.env` / EAS | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`, `EXPO_PUBLIC_TERMS_URL`, `EXPO_PUBLIC_PRIVACY_URL` |
| GitHub Actions secrets (deployment) | `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `SSH_PRIVATE_KEY` |

`.env` files, `.p8`/`.pem` keys and keystores are excluded in `.gitignore`. In the documentation, demo account credentials and personal data are shown as placeholders (`<DEMO_EMAIL>`, `<DEMO_PASSWORD>`, `<CONTACT_NAME>`).

---

## Roadmap

- Integrations with generator controllers and monitoring platforms (IoT/telemetry) to replace estimates with live data.
- Push notifications (APNs/FCM).
- Predictive failure detection from reading history and fault-code photos.
- Weather- and outage-aware alerts ("run a pre-storm check now").
- Marketplace expansion: ZIP-radius matching, in-app payments to technicians and parts ordering.
- An enterprise tier with multi-site dashboards and compliance logs (NFPA 110-style).

---

## Tech stack

**Backend:** Laravel 12 · PHP 8.2+ · Sanctum · Cashier (Stripe) · Prism PHP (Google Gemini) · DomPDF · PHPUnit · Pint
**App:** React Native · Expo · TypeScript · Expo Router · Redux Toolkit · SWR · Axios · React Native Paper · Reanimated · RevenueCat
**Infrastructure:** EAS Build · GitHub Actions (atomic deployments to a VPS)
