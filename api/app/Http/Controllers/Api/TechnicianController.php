<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TechnicianStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnicianController extends Controller
{
    /**
     * The technician panel status for the caller's active org: whether it's a
     * provider, subscription/trial state, service areas, and whether the panel
     * is unlocked. Any member may read it.
     *
     * GET /api/technician
     */
    public function show(Request $request, TechnicianStatus $status): JsonResponse
    {
        return response()->json([
            'technician' => $status->for($request->user()),
        ]);
    }
}
