<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Verifies the identity token produced by native "Sign in with Apple".
 *
 * The app runs `AppleAuthentication.signInAsync()` and posts us the resulting
 * `identityToken` (a JWT signed by Apple). We verify the signature against
 * Apple's published JWKS, then check the standard claims. Mirrors the role
 * `Google\Auth\AccessToken` plays for Google Sign-In, and is resolved from the
 * container so tests can swap it out.
 */
class AppleIdentityToken
{
    private const JWKS_URL = 'https://appleid.apple.com/auth/keys';

    private const ISSUER = 'https://appleid.apple.com';

    private const CACHE_KEY = 'apple.jwks';

    /**
     * Verify an identity token and return its claims.
     *
     * @return array<string, mixed>|null null when the token is unverifiable
     */
    public function verify(string $identityToken): ?array
    {
        $claims = $this->decode($identityToken);

        if ($claims === null) {
            return null;
        }

        if (($claims['iss'] ?? null) !== self::ISSUER) {
            return null;
        }

        if (empty($claims['sub'])) {
            return null;
        }

        return $claims;
    }

    /**
     * Decode + signature-check the JWT. Apple rotates its signing keys, so a
     * cached key set that no longer covers the token's `kid` is refetched once
     * before giving up.
     *
     * @return array<string, mixed>|null
     */
    private function decode(string $identityToken, bool $allowRefresh = true): ?array
    {
        try {
            $keys = JWK::parseKeySet($this->jwks());

            return (array) JWT::decode($identityToken, $keys);
        } catch (Throwable $e) {
            if ($allowRefresh && str_contains($e->getMessage(), 'kid')) {
                Cache::forget(self::CACHE_KEY);

                return $this->decode($identityToken, allowRefresh: false);
            }

            Log::warning('Apple identity token verification failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Apple's public key set, cached for a day (the keys are long-lived).
     *
     * @return array{keys: array<int, array<string, mixed>>}
     */
    private function jwks(): array
    {
        return Cache::remember(self::CACHE_KEY, now()->addDay(), function (): array {
            $response = Http::timeout(10)->get(self::JWKS_URL)->throw();

            return $response->json();
        });
    }
}
