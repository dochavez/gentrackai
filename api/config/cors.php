<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Applies to the API (and Sanctum CSRF cookie) routes. The app authenticates
    | with bearer tokens rather than cookies, so credentials are not required and
    | any origin may call the API. Tighten `allowed_origins` for production if
    | the API is only meant to be reached by known web origins.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
