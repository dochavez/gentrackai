# Controllers

- A resource controller may only define the standard Laravel actions: `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`. Do not add other public action methods to it.
- Any non-resource action goes in its own **single-action (invokable) controller** with a single `__invoke()` method, named for the action. Create it with `php artisan make:controller Api/DoSomethingController --invokable` and route it as `Route::post('/path', DoSomethingController::class)`. Example: label scanning lives in `ScanGeneratorController`, not as `GeneratorController@scan`.
- Keep controllers thin — they orchestrate (validate → delegate → respond). When an action's logic grows beyond orchestration, extract it into a service (`app/Services`) or a repository and inject it (e.g. `GeneratorLabelExtractor`).
