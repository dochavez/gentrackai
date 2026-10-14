<?php

namespace Tests\Unit;

use App\Support\GeminiRetry;
use GuzzleHttp\Psr7\Response as Psr7Response;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use PHPUnit\Framework\TestCase;

class GeminiRetryTest extends TestCase
{
    public function test_options_shape(): void
    {
        [$times, $sleep, $when, $throw] = GeminiRetry::options();

        $this->assertSame(3, $times);
        $this->assertInstanceOf(\Closure::class, $sleep);
        $this->assertInstanceOf(\Closure::class, $when);
        $this->assertTrue($throw);
    }

    /**
     * Fast, transient upstream failures (overload, rate limit, bad gateway) must
     * be retried — that is the whole point: Gemini's 503 "model is overloaded".
     */
    public function test_retries_fast_transient_statuses(): void
    {
        $when = GeminiRetry::options()[2];

        foreach ([429, 500, 502, 503] as $status) {
            $this->assertTrue($when($this->requestException($status)), "should retry $status");
        }
    }

    /**
     * Client errors are our fault, and timeouts (connection + gateway) already
     * burned the full request budget — retrying either just wastes time on a
     * synchronous request, so both must fail fast.
     */
    public function test_does_not_retry_client_errors_or_timeouts(): void
    {
        $when = GeminiRetry::options()[2];

        foreach ([400, 401, 403, 404, 408, 422, 504] as $status) {
            $this->assertFalse($when($this->requestException($status)), "should not retry $status");
        }

        $this->assertFalse(
            $when(new ConnectionException('cURL error 28: Operation timed out')),
            'must not retry connection/read timeouts'
        );
    }

    /** Backoff grows exponentially, is capped at 2s, and never exceeds base + jitter. */
    public function test_backoff_grows_and_is_bounded(): void
    {
        $sleep = GeminiRetry::options()[1];

        foreach ([1 => 500, 2 => 1000, 3 => 2000] as $attempt => $base) {
            $ms = $sleep($attempt);
            $this->assertGreaterThanOrEqual($base, $ms, "attempt $attempt floor");
            $this->assertLessThanOrEqual($base + 250, $ms, "attempt $attempt ceiling (jitter)");
        }
    }

    private function requestException(int $status): RequestException
    {
        return new RequestException(new Response(new Psr7Response($status)));
    }
}
