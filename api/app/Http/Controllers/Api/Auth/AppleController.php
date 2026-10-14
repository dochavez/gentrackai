<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AppleLoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AppleIdentityToken;
use App\Services\AppleTokens;
use App\Services\Teams;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class AppleController extends Controller
{
    public function __construct(
        private readonly AppleIdentityToken $identityToken = new AppleIdentityToken,
        private readonly AppleTokens $tokens = new AppleTokens,
        private readonly Teams $teams = new Teams,
    ) {}

    /**
     * Sign in (or sign up) with Apple. Required by App Store guideline 4.8
     * alongside Google Sign-In.
     *
     * The app runs the native flow and posts the resulting identity token here.
     * We verify it against Apple's JWKS, confirm the audience is our bundle id,
     * then find/link/create the local user and issue an API token.
     *
     * POST /api/auth/apple
     * Body: { identity_token, authorization_code?, name?, device_name? }
     * 200: { user, token }
     */
    public function store(AppleLoginRequest $request): JsonResponse
    {
        $claims = $this->identityToken->verify((string) $request->string('identity_token'));

        if (! $claims) {
            return response()->json(['message' => 'Invalid or expired Apple token.'], 401);
        }

        $allowedAudiences = array_filter((array) config('services.apple.bundle_ids'));

        if ($allowedAudiences && ! in_array($claims['aud'] ?? null, $allowedAudiences, true)) {
            return response()->json(['message' => 'Apple token was issued for a different app.'], 401);
        }

        $user = $this->resolveUser($claims, $request->input('name'));

        if (! $user) {
            return response()->json([
                'message' => 'Apple did not share an email address. Please sign in with email instead.',
            ], 422);
        }

        $this->rememberRefreshToken($user, $request->input('authorization_code'));

        $token = $user->createToken((string) $request->input('device_name', 'mobile'))->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * Find the user by Apple id, link an existing account by email, or create a
     * brand-new Apple-provisioned user.
     *
     * Returning users are matched on `sub` alone: Apple's private-relay
     * addresses are stable per user, but the email claim can be absent on
     * subsequent sign-ins, so `sub` is the only dependable key.
     *
     * @param  array<string, mixed>  $claims
     */
    private function resolveUser(array $claims, ?string $name): ?User
    {
        $user = User::where('apple_id', $claims['sub'])->first();

        if ($user) {
            return $user;
        }

        $email = filter_var($claims['email'] ?? null, FILTER_VALIDATE_EMAIL) ?: null;

        if (! $email) {
            return null;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->forceFill([
                'apple_id' => $claims['sub'],
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            return $user;
        }

        $user = User::create([
            'name' => Str::of($name ?? '')->trim()->value() ?: (string) Str::of($email)->before('@'),
            'email' => $email,
            'apple_id' => $claims['sub'],
            'provider' => 'apple',
            'password' => null,
            // Apple has already verified the address (relay addresses included).
            'email_verified_at' => now(),
        ]);

        $this->teams->provisionForNewUser($user);

        return $user;
    }

    /**
     * Exchange the one-time authorization code for a refresh token and keep it,
     * so account deletion can revoke the Apple grant (guideline 5.1.1(v)).
     *
     * Entirely best effort: the code is single-use and short-lived, and the
     * server credentials are optional, so a failure here must never block a
     * sign-in. An existing token is kept rather than overwritten with null.
     */
    private function rememberRefreshToken(User $user, ?string $authorizationCode): void
    {
        if (! $authorizationCode || ! $this->tokens->isConfigured()) {
            return;
        }

        $refreshToken = $this->tokens->exchangeAuthorizationCode($authorizationCode);

        if (! $refreshToken) {
            return;
        }

        $user->forceFill(['apple_refresh_token' => $refreshToken])->save();
    }
}
