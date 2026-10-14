<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Estimated-savings multiplier
    |--------------------------------------------------------------------------
    |
    | Rough estimate of the value a completed preventive service returns by
    | avoiding a costlier emergency repair / downtime, expressed as a fraction
    | of the cost paid. e.g. 0.45 → a $100 preventive service is estimated to
    | have saved ~$45. Surfaced as "Est. saved" on the maintenance report.
    |
    */

    'savings_multiplier' => (float) env('MAINTENANCE_SAVINGS_MULTIPLIER', 0.45),

    /*
    |--------------------------------------------------------------------------
    | Reminder lead time (days)
    |--------------------------------------------------------------------------
    |
    | How many days ahead of the due date the daily `maintenance:send-reminders`
    | job notifies the assignee. 0 → remind on the due date itself. Overdue
    | items that have never been reminded are always caught on the next run.
    |
    */

    'reminder_lead_days' => (int) env('MAINTENANCE_REMINDER_LEAD_DAYS', 0),

];
