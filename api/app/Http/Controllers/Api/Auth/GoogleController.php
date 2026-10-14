<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Teams;
use Google\Auth\AccessToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class GoogleController extends Controller
{
    public function __construct(
        private readonly AccessToken $accessToken = new AccessToken,
        private readonly Teams $teams = new Teams,
    ) {}

    /**
     * Sign in (or sign up) with Google.
     *
     * The app runs the native Google flow and posts the resulting ID token
     * here. We verify the token against Google's certs, confirm its audience
     * matches one of our OAuth client IDs, then find/link/create the local
     * user and issue an API token.
     *
     * POST /api/auth/google
     * Body: { id_token, device_name? }
     * 200: { user, token }
     */
    public function store(GoogleLoginRequest $request): JsonResponse
    {
        $payload = $this->verifyIdToken((string) $request->string('id_token'));

        if (! $payload) {
            return response()->json(['message' => 'Invalid or expired Google token.'], 401);
        }

        $allowedAudiences = array_filter([
            config('services.google.client_id'),
            config('services.google.ios_client_id'),
        ]);

        if ($allowedAudiences && ! in_array($payload['aud'] ?? null, $allowedAudiences, true)) {
            return response()->json(['message' => 'Google token was issued for a different app.'], 401);
        }

        if (empty($payload['email'])) {
            return response()->json(['message' => 'Google account has no email.'], 422);
        }

        $user = $this->resolveUser($payload);

        $token = $user->createToken((string) $request->input('device_name', 'mobile'))->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function verifyIdToken(string $idToken): ?array
    {
        try {
            $payload = $this->accessToken->verify($idToken);

            return $payload ?: null;
        } catch (Throwable $e) {
            Log::warning('Google ID token verification failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Find the user by Google id, link an existing account by email, or create
     * a brand-new Google-provisioned user.
     *
     * @param  array<string, mixed>  $payload
     */
    private function resolveUser(array $payload): User
    {
        $user = User::where('google_id', $payload['sub'])->first();

        if ($user) {
            return $user;
        }

        $user = User::where('email', $payload['email'])->first();

        if ($user) {
            $user->forceFill([
                'google_id' => $payload['sub'],
                'avatar' => $user->avatar ?: ($payload['picture'] ?? null),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            return $user;
        }

        $user = User::create([
            'name' => $payload['name'] ?? (string) str($payload['email'])->before('@'),
            'email' => $payload['email'],
            'google_id' => $payload['sub'],
            'avatar' => $payload['picture'] ?? null,
            'provider' => 'google',
            'password' => null,
            'email_verified_at' => now(),
        ]);

        $this->teams->provisionForNewUser($user);

        return $user;
    }
}
