<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Daily backstop: regenerate any AI insights whose fleet data has drifted.
Schedule::command('insights:refresh-stale')->daily();

// Daily: remind assignees of maintenance that is due (in-app + email), once per item.
Schedule::command('maintenance:send-reminders')->dailyAt('08:00');
