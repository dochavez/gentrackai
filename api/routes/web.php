<?php

use App\Http\Controllers\BillingReturnController;
use App\Http\Controllers\VerifyEmailController;
use App\Http\Controllers\WellKnownController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| Billing return (Stripe Checkout / portal → back into the app)
|--------------------------------------------------------------------------
|
| Stripe returns the customer here after Checkout or the billing portal; this
| HTTPS page bounces the in-app browser back into the mobile app via its deep
| link (Stripe can't redirect to a custom scheme). `/billing` is kept as an
| alias for any success URL already issued before this route existed.
|
*/
Route::get('/billing/return', BillingReturnController::class)->name('billing.return');
Route::get('/billing', BillingReturnController::class);

/*
|--------------------------------------------------------------------------
| Email verification (emailed link → back into the app)
|--------------------------------------------------------------------------
|
| The verification email links here (a temporary signed URL). We validate the
| id/hash, mark the user verified, and bounce back into the app via its deep
| link — no web session needed.
|
*/
Route::get('/email/verify/{id}/{hash}', VerifyEmailController::class)
    ->middleware('signed')
    ->name('verification.verify');

/*
|--------------------------------------------------------------------------
| App association files (deep links)
|--------------------------------------------------------------------------
|
| Let the mobile app claim the emailed reset link (/reset-password) via iOS
| Universal Links and Android App Links. Must be served over HTTPS as JSON
| with no redirect. See config/deeplink.php for the identity values.
|
*/
Route::get('.well-known/apple-app-site-association', [WellKnownController::class, 'appleAppSiteAssociation']);
Route::get('.well-known/assetlinks.json', [WellKnownController::class, 'assetLinks']);
