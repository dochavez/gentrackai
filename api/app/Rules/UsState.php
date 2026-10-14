<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates a USPS two-letter state/territory code against config/us_states.php.
 * Case-insensitive; controllers/requests should uppercase the value on the way in.
 */
class UsState implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $codes = (array) config('us_states.codes', []);

        if (! is_string($value) || ! in_array(strtoupper($value), $codes, true)) {
            $fail('The :attribute must be a valid US state code.');
        }
    }
}
