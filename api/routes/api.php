<?php

use App\Http\Controllers\Api\AcceptOfferController;
use App\Http\Controllers\Api\AssignTechnicianController;
use App\Http\Controllers\Api\Auth\AppleController;
use App\Http\Controllers\Api\Auth\DeleteAccountController;
use App\Http\Controllers\Api\Auth\EmailVerificationController;
use App\Http\Controllers\Api\Auth\GoogleController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\CancelMaintenanceRequestController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\CompleteJobController;
use App\Http\Controllers\Api\CreateBillingPortalController;
use App\Http\Controllers\Api\CreateCheckoutSessionController;
use App\Http\Controllers\Api\DownloadMaintenanceReportController;
use App\Http\Controllers\Api\GeneratorController;
use App\Http\Controllers\Api\GeneratorReadingController;
use App\Http\Controllers\Api\InsightController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\MaintenanceReportController;
use App\Http\Controllers\Api\MaintenanceRequestController;
use App\Http\Controllers\Api\MarkAllNotificationsReadController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\OrganizationController;
// Maintenance marketplace (customer side)
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProviderProfileController;
use App\Http\Controllers\Api\RefreshInsightsController;
use App\Http\Controllers\Api\RequestReviewController;
// Maintenance marketplace (technician side)
use App\Http\Controllers\Api\ScanGeneratorController;
use App\Http\Controllers\Api\ScheduleJobController;
use App\Http\Controllers\Api\ServiceAreaController;
use App\Http\Controllers\Api\SetupTechnicianPaymentController;
use App\Http\Controllers\Api\StoreMaintenanceReviewController;
use App\Http\Controllers\Api\SubscribeTechnicianController;
use App\Http\Controllers\Api\SwitchOrganizationController;
use App\Http\Controllers\Api\SyncStoreSubscriptionController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TechnicianBillingController;
use App\Http\Controllers\Api\TechnicianController;
use App\Http\Controllers\Api\TechnicianJobController;
use App\Http\Controllers\Api\TechnicianOnboardingController;
use App\Http\Controllers\Api\TechnicianRequestController;
use App\Http\Controllers\Api\UpdateTechnicianProfileController;
use App\Http\Controllers\Webhooks\RevenueCatWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Token-based auth (Sanctum personal access tokens) for the mobile/web app.
| Public endpoints issue a bearer token; protected endpoints require it via
| the `Authorization: Bearer <token>` header.
|
*/

// Public — throttled to blunt brute-force / abuse.
Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'store']);
    Route::post('/login', [LoginController::class, 'store']);
    Route::post('/auth/google', [GoogleController::class, 'store']);
    Route::post('/auth/apple', [AppleController::class, 'store']);
    Route::post('/forgot-password', [PasswordResetController::class, 'forgot']);
    Route::post('/reset-password', [PasswordResetController::class, 'reset']);
});

/*
|--------------------------------------------------------------------------
| Webhooks
|--------------------------------------------------------------------------
|
| RevenueCat posts App Store / Play Store subscription lifecycle events here
| (renewals, cancellations, expiries). Authenticated by a shared secret in the
| Authorization header, so it sits outside the bearer-token group. Stripe's own
| webhook is registered by Cashier.
|
*/

Route::post('/webhooks/revenuecat', RevenueCatWebhookController::class);

// Protected — requires a valid bearer token.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [LoginController::class, 'me']);
    Route::patch('/user/profile', [ProfileController::class, 'update']);
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])->middleware('throttle:6,1');
    Route::post('/logout', [LoginController::class, 'destroy']);
    Route::delete('/user', DeleteAccountController::class); // permanent account deletion (App Store 5.1.1(v))

    // Organization / team
    Route::get('/organization', [OrganizationController::class, 'show']);
    Route::post('/organization/switch', SwitchOrganizationController::class);
    Route::post('/organization/invitations', [InvitationController::class, 'store']);
    Route::patch('/organization/members/{user}', [MemberController::class, 'update']);
    Route::delete('/organization/members/{user}', [MemberController::class, 'destroy']);
    Route::get('/invitations', [InvitationController::class, 'index']);
    Route::patch('/invitations/{invitation}', [InvitationController::class, 'update']);
    Route::delete('/invitations/{invitation}', [InvitationController::class, 'destroy']);

    // Generators
    Route::get('/generators', [GeneratorController::class, 'index']);
    Route::post('/generators', [GeneratorController::class, 'store']);
    Route::post('/generators/scan', ScanGeneratorController::class);
    Route::get('/generators/{generator}', [GeneratorController::class, 'show']);
    Route::patch('/generators/{generator}', [GeneratorController::class, 'update']);
    Route::delete('/generators/{generator}', [GeneratorController::class, 'destroy']);

    // Usage readings (logged consumption per generator)
    Route::get('/generators/{generator}/readings', [GeneratorReadingController::class, 'index']);
    Route::post('/generators/{generator}/readings', [GeneratorReadingController::class, 'store']);

    // Maintenance report (fleet-wide) — declared before the nested routes below.
    Route::get('/maintenance/report', MaintenanceReportController::class);
    Route::get('/maintenance/report/pdf', DownloadMaintenanceReportController::class);

    // Maintenance (scheduled per generator)
    Route::get('/generators/{generator}/maintenance', [MaintenanceController::class, 'index']);
    Route::post('/generators/{generator}/maintenance', [MaintenanceController::class, 'store']);
    Route::patch('/generators/{generator}/maintenance/{maintenanceItem}', [MaintenanceController::class, 'update']);

    // Maintenance marketplace (customer side) — request external technicians,
    // review their offers, accept one, then review the completed job.
    Route::get('/maintenance-requests', [MaintenanceRequestController::class, 'index']);
    Route::post('/maintenance-requests', [MaintenanceRequestController::class, 'store']);
    Route::get('/maintenance-requests/{maintenanceRequest}', [MaintenanceRequestController::class, 'show']);
    Route::post('/maintenance-requests/{maintenanceRequest}/offers/{offer}/accept', AcceptOfferController::class);
    Route::post('/maintenance-requests/{maintenanceRequest}/cancel', CancelMaintenanceRequestController::class);
    Route::post('/maintenance-requests/{maintenanceRequest}/review', StoreMaintenanceReviewController::class);

    // Technician panel (provider side) — status, onboarding, service areas.
    Route::get('/technician', [TechnicianController::class, 'show']);
    Route::post('/technician/onboarding', TechnicianOnboardingController::class);
    Route::patch('/technician/profile', UpdateTechnicianProfileController::class);
    Route::put('/technician/service-areas', [ServiceAreaController::class, 'update']);

    // Technician feed & offers.
    Route::get('/technician/requests', [TechnicianRequestController::class, 'index']);
    Route::get('/technician/requests/{maintenanceRequest}', [TechnicianRequestController::class, 'show']);
    Route::post('/technician/requests/{maintenanceRequest}/offers', [OfferController::class, 'store']);
    Route::delete('/technician/offers/{offer}', [OfferController::class, 'destroy']);

    // Technician jobs.
    Route::get('/technician/jobs', [TechnicianJobController::class, 'index']);
    Route::get('/technician/jobs/{maintenanceRequest}', [TechnicianJobController::class, 'show']);
    Route::post('/technician/jobs/{maintenanceRequest}/assign', AssignTechnicianController::class);
    Route::patch('/technician/jobs/{maintenanceRequest}/schedule', ScheduleJobController::class);
    Route::patch('/technician/jobs/{maintenanceRequest}/complete', CompleteJobController::class);
    Route::post('/technician/jobs/{maintenanceRequest}/request-review', RequestReviewController::class);

    // Technician billing (separate 'technician' subscription; payment up front).
    Route::get('/technician/billing', [TechnicianBillingController::class, 'show']);
    Route::post('/technician/billing/setup', SetupTechnicianPaymentController::class);
    Route::post('/technician/billing/checkout', SubscribeTechnicianController::class);
    Route::post('/technician/billing/portal', CreateBillingPortalController::class);

    // Public provider profile (rating + reviews).
    Route::get('/providers/{organization}/profile', [ProviderProfileController::class, 'show']);

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::patch('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    // Insights (deterministic analytics + cached AI recommendation)
    Route::get('/insights', [InsightController::class, 'index']);
    Route::post('/insights/refresh', RefreshInsightsController::class)->middleware('throttle:6,60');

    // Chat assistant (fleet-aware, tool calling)
    Route::get('/chat', [ChatController::class, 'index']);
    Route::post('/chat', [ChatController::class, 'store'])->middleware('throttle:20,1');
    Route::delete('/chat', [ChatController::class, 'destroy']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', MarkAllNotificationsReadController::class);
    Route::patch('/notifications/{notification}', [NotificationController::class, 'update']);

    // Billing (per-organization Stripe subscription — web Checkout, not IAP)
    Route::get('/billing', [BillingController::class, 'show']);
    Route::post('/billing/checkout', CreateCheckoutSessionController::class);
    Route::post('/billing/portal', CreateBillingPortalController::class);
    // In-App Purchase (iOS StoreKit via RevenueCat) — the app calls this the
    // moment a purchase completes, ahead of the webhook.
    Route::post('/billing/iap/sync', SyncStoreSubscriptionController::class);
});
