<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI recommendation cache
    |--------------------------------------------------------------------------
    |
    | The AI recommendation is regenerated (via Gemini) only when the fleet's
    | input digest changes or the cached copy goes stale. `ttl_days` forces a
    | refresh even if nothing changed; `min_interval_hours` throttles how often
    | a digest change may trigger regeneration, so rapid logging doesn't burn
    | tokens. Deterministic analytics are always computed fresh (no tokens).
    |
    */

    'ttl_days' => (int) env('INSIGHTS_TTL_DAYS', 7),

    'min_interval_hours' => (int) env('INSIGHTS_MIN_INTERVAL_HOURS', 24),

];
