<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MaintenanceReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DownloadMaintenanceReportController extends Controller
{
    /**
     * The maintenance report rendered as a downloadable PDF (for share/email).
     *
     * GET /api/maintenance/report/pdf
     */
    public function __invoke(Request $request, MaintenanceReport $report): Response
    {
        $data = $report->build($request->user()->organization, (string) $request->query('period', '6mo'));

        $pdf = Pdf::loadView('reports.maintenance', [
            'report' => $data,
            'user' => $request->user(),
        ]);

        return $pdf->download('maintenance-report.pdf');
    }
}
