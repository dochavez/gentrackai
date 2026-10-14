<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\AccountDeletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeleteAccountController extends Controller
{
    public function __construct(private AccountDeletion $accounts) {}

    /**
     * Permanently delete the authenticated user's account and personal data.
     * Required by App Store Review guideline 5.1.1(v). Irreversible — the caller
     * (app) confirms intent before hitting this. Shared org data stays with the
     * team (see AccountDeletion).
     *
     * DELETE /api/user  (auth:sanctum)
     * 204
     */
    public function __invoke(Request $request): JsonResponse
    {
        $this->accounts->delete($request->user());

        return response()->json(null, 204);
    }
}
