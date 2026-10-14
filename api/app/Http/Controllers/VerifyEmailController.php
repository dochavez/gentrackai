<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Handles the emailed verification link. The URL is a temporary signed route
 * (see the default VerifyEmail notification), so no session is required — we
 * validate the {id}/{hash} against the user's email, mark them verified, and
 * return a page that deep-links back into the mobile app.
 *
 * GET /email/verify/{id}/{hash}  (middleware: signed) — name: verification.verify
 */
class VerifyEmailController extends Controller
{
    private const DEEP_LINK = 'gentrackai://verify-email';

    public function __invoke(Request $request, string $id, string $hash): View
    {
        $user = User::find($id);
        $ok = false;

        if ($user !== null && hash_equals($hash, sha1($user->getEmailForVerification()))) {
            if (! $user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
                event(new Verified($user));
            }
            $ok = true;
        }

        return view('emails.verified', [
            'ok' => $ok,
            'deepLink' => self::DEEP_LINK.'?status='.($ok ? 'verified' : 'error'),
        ]);
    }
}
