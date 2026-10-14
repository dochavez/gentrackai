<?php

/*
|--------------------------------------------------------------------------
| US state / territory codes
|--------------------------------------------------------------------------
|
| The canonical USPS two-letter codes used to validate `users.state` and a
| provider's service areas, and to drive technician area matching. Keeping the
| list here (not geo) matches the "no geo for now" decision. `App\Rules\UsState`
| validates against this list.
|
*/

return [
    'codes' => [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
        // District of Columbia + inhabited territories.
        'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
    ],
];
