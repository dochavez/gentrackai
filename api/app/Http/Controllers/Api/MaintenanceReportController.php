<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MaintenanceReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceReportController extends Controller
{
    /**
     * Fleet maintenance report (completed services + cost + estimated savings)
     * over `?period=3mo|6mo|9mo|1y|5y` (default 6mo).
     *
     * GET /api/maintenance/report
     */
    public function __invoke(Request $request, MaintenanceReport $report): JsonResponse
    {
        return response()->json(
            $report->build($request->user()->organization, (string) $request->query('period', '6mo'))
        );
    }
}
