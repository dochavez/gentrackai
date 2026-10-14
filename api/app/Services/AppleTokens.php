<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Talks to Apple's OAuth endpoints on behalf of the app.
 *
 * Two jobs, both driven by App Store guideline 5.1.1(v): exchange the one-time
 * `authorizationCode` from the native sign-in for a long-lived refresh token,
 * and later revoke that token when the user deletes their account. Identity
 * *token* verification is a separate concern — see AppleIdentityToken.
 *
 * Authenticating to Apple requires a client secret that is itself a short-lived
 * ES256 JWT signed with the private key (.p8) downloaded from the Apple
 * Developer portal. When that key isn't configured, every method is a no-op —
 * sign-in and account deletion must never break because revocation is unset up.
 */
class AppleTokens
{
    private const TOKEN_URL = 'https://appleid.apple.com/auth/token';

    private const REVOKE_URL = 'https://appleid.apple.com/auth/revoke';

    private const AUDIENCE = 'https://appleid.apple.com';

    /** Apple caps the client secret at 6 months; it's single-use here, so keep it short. */
    private const SECRET_TTL_SECONDS = 300;

    /**
     * True when team id, key id, private key and client id are all present.
     * Callers use this to skip the round trip entirely.
     */
    public function isConfigured(): bool
    {
        return $this->teamId() !== null
            && $this->keyId() !== null
            && $this->privateKey() !== null
            && $this->clientId() !== null;
    }

    /**
     * Trade the native flow's one-time authorization code for a refresh token.
     *
     * @return string|null the refresh token, or null when unconfigured or Apple
     *                     rejects the code (the code is single-use and expires
     *                     in minutes, so this is best effort by design)
     */
    public function exchangeAuthorizationCode(string $authorizationCode): ?string
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $secret = $this->clientSecret();

        if ($secret === null) {
            return null;
        }

        try {
            $response = Http::asForm()->timeout(10)->post(self::TOKEN_URL, [
                'client_id' => $this->clientId(),
                'client_secret' => $secret,
                'code' => $authorizationCode,
                'grant_type' => 'authorization_code',
            ]);

            if ($response->failed()) {
                Log::warning('Apple authorization code exchange failed', [
                    'status' => $response->status(),
                    'error' => $response->json('error'),
                ]);

                return null;
            }

            $refreshToken = $response->json('refresh_token');

            return is_string($refreshToken) && $refreshToken !== '' ? $refreshToken : null;
        } catch (Throwable $e) {
            Log::warning('Apple authorization code exchange errored', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Revoke a user's Apple grant. Required before deleting an account that
     * signed in with Apple, so the app stops appearing under the user's Apple ID
     * settings.
     *
     * @return bool whether Apple confirmed the revocation
     */
    public function revokeRefreshToken(string $refreshToken): bool
    {
        if (! $this->isConfigured()) {
            Log::warning('Apple token revocation skipped: Sign in with Apple server credentials are not configured.');

            return false;
        }

        $secret = $this->clientSecret();

        if ($secret === null) {
            return false;
        }

        try {
            $response = Http::asForm()->timeout(10)->post(self::REVOKE_URL, [
                'client_id' => $this->clientId(),
                'client_secret' => $secret,
                'token' => $refreshToken,
                'token_type_hint' => 'refresh_token',
            ]);

            if ($response->failed()) {
                Log::warning('Apple token revocation failed', [
                    'status' => $response->status(),
                    'error' => $response->json('error'),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::warning('Apple token revocation errored', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * The ES256 JWT Apple accepts in place of a static client secret. Signed
     * with the .p8 private key; `kid` identifies which key was used.
     */
    private function clientSecret(): ?string
    {
        try {
            $now = time();

            return JWT::encode([
                'iss' => $this->teamId(),
                'iat' => $now,
                'exp' => $now + self::SECRET_TTL_SECONDS,
                'aud' => self::AUDIENCE,
                'sub' => $this->clientId(),
            ], (string) $this->privateKey(), 'ES256', $this->keyId());
        } catch (Throwable $e) {
            Log::warning('Could not sign the Apple client secret', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function teamId(): ?string
    {
        return $this->configString('services.apple.team_id');
    }

    private function keyId(): ?string
    {
        return $this->configString('services.apple.key_id');
    }

    /**
     * The bundle identifier the native app authorized against — Apple treats it
     * as the OAuth client id. Falls back to the first accepted audience so a
     * single-bundle setup needs no extra env var.
     */
    private function clientId(): ?string
    {
        $explicit = $this->configString('services.apple.client_id');

        if ($explicit !== null) {
            return $explicit;
        }

        $bundleIds = array_values(array_filter((array) config('services.apple.bundle_ids')));

        return $bundleIds[0] ?? null;
    }

    /**
     * The .p8 contents. `APPLE_PRIVATE_KEY` may hold either the PEM itself
     * (with escaped newlines, as env files require) or a path to the key file.
     */
    private function privateKey(): ?string
    {
        $value = $this->configString('services.apple.private_key');

        if ($value === null) {
            return null;
        }

        if (! str_contains($value, 'BEGIN') && is_file($value)) {
            $contents = file_get_contents($value);

            return $contents !== false ? $contents : null;
        }

        return str_replace('\n', "\n", $value);
    }

    private function configString(string $key): ?string
    {
        $value = config($key);

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }
}
