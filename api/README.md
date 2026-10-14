# GentrackAI API (Laravel 12)

The GentrackAI backend: a REST API for the mobile app. It holds all business logic and every AI call (Google Gemini), so keys, prompts and usage limits never reach the client.

See the [main README](../README.md) for the full product description.

## Main modules

- **Auth:** email/password, Google and Apple (with token revocation on account deletion), email verification and password reset.
- **Generators:** create/edit, AI nameplate scanning (`ScanGeneratorController` → `GeneratorLabelExtractor`), readings and usage projection (`GeneratorUsage`).
- **Maintenance and tasks:** service schedules, assignment, daily reminders and PDF reports.
- **Insights and chat:** `InsightGenerator` / `GenerateInsightsJob` and `ChatAssistant` with tool calling.
- **Organizations:** multi-organization membership, roles and invitations.
- **Marketplace:** maintenance requests, offers, scheduling, completion and reviews; technician profiles and service areas.
- **Billing:** Stripe (Cashier) and RevenueCat (`StoreEntitlements`, webhook), with plan limits enforced in `PlanGate` / `TechnicianGate`.

## Development

```bash
composer install
cp .env.example .env      # fill in your credentials; never commit .env
php artisan key:generate
php artisan migrate
php artisan serve
php artisan queue:work
php artisan test
```

Scheduled jobs (`routes/console.php`): `insights:refresh-stale` (daily) and `maintenance:send-reminders` (08:00).
