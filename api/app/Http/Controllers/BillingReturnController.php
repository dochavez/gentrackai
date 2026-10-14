<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * The page Stripe redirects to after Checkout or the billing portal. Checkout
 * happens in an in-app browser (expo-web-browser), so this HTTPS page exists
 * only to bounce the customer back into the mobile app via its deep link —
 * Stripe won't redirect to a custom scheme directly, and previously these URLs
 * pointed at a non-existent route and 404'd.
 *
 * GET /billing/return  (and legacy /billing)
 */
class BillingReturnController extends Controller
{
    /**
     * Deep-link schemes we'll redirect back to. Anything else is ignored (open
     * redirect guard) and we fall back to the app's own scheme.
     */
    private const ALLOWED_SCHEMES = ['gentrackai://', 'exp://', 'exp+gentrackai://'];

    private const DEFAULT_RETURN = 'gentrackai://upgrade';

    public function __invoke(Request $request): View
    {
        $status = in_array($request->query('status'), ['success', 'cancel', 'portal'], true)
            ? $request->query('status')
            : 'success';

        // The app sends its own return URL through Checkout; validate the scheme
        // so we only ever bounce back into the app itself.
        $return = (string) $request->query('return', '');
        $base = '';
        foreach (self::ALLOWED_SCHEMES as $scheme) {
            if (str_starts_with($return, $scheme)) {
                $base = $return;
                break;
            }
        }
        if ($base === '') {
            $base = self::DEFAULT_RETURN;
        }

        $deepLink = $base.(str_contains($base, '?') ? '&' : '?').'checkout='.$status;

        $copy = match ($status) {
            'cancel' => ['title' => 'Checkout canceled', 'body' => 'No charge was made. You can pick a plan whenever you’re ready.'],
            'portal' => ['title' => 'All set', 'body' => 'Your billing changes have been saved.'],
            default => ['title' => 'You’re on Pro 🎉', 'body' => 'Payment received. Your whole team now has the full toolkit.'],
        };

        return view('billing.return', [
            'title' => $copy['title'],
            'body' => $copy['body'],
            'deepLink' => $deepLink,
        ]);
    }
}
