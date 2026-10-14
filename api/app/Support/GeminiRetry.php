<?php

namespace App\Support;

use Illuminate\Http\Client\RequestException;
use Throwable;

/**
 * Retry policy for Prism → Gemini calls.
 *
 * Gemini's flash models routinely return a transient 503 "The model is
 * overloaded" — Google shedding load on their side (capacity, not our quota or
 * key), which hits every caller regardless of tier. Those come back fast, so
 * Google's documented remedy — a short exponential backoff + jitter — is safe
 * and effective. Every Prism call spreads these options onto its builder:
 *
 *     Prism::structured()->using(Provider::Gemini, $model)
 *         ->withClientRetry(...GeminiRetry::options())
 *
 * We deliberately DO NOT retry connection/read timeouts (cURL 28) or gateway
 * timeouts (504/408): each of those already burned the full request timeout, so
 * retrying them multiplies wall-clock time on a synchronous request and just
 * starves the client (which gave up long ago). Those fail fast; the caller
 * turns the resulting exception into a friendly "try again" for the app.
 */
class GeminiRetry
{
    /** Fast, transient server-side failures worth a quick retry. */
    private const RETRYABLE = [429, 500, 502, 503];

    /** Total attempts (1 initial + 2 retries). */
    private const ATTEMPTS = 3;

    /**
     * Args to spread into Prism's withClientRetry():
     * [$times, $sleepMilliseconds, $when, $throw].
     *
     * @return array{0: int, 1: \Closure, 2: \Closure, 3: bool}
     */
    public static function options(): array
    {
        return [
            self::ATTEMPTS,
            // Exponential backoff (0.5s, 1s) with jitter to avoid a thundering
            // herd of clients retrying in lockstep.
            fn (int $attempt): int => min(2000, (int) (500 * (2 ** ($attempt - 1)))) + random_int(0, 250),
            fn (Throwable $e): bool => self::shouldRetry($e),
            true,
        ];
    }

    private static function shouldRetry(Throwable $e): bool
    {
        // Only fast HTTP failures — never ConnectionException (timeouts), which
        // would already have consumed the full request timeout.
        return $e instanceof RequestException
            && in_array($e->response->status(), self::RETRYABLE, true);
    }
}
