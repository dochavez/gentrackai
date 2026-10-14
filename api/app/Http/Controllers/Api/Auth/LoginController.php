<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Authenticate an email/password user and return an API token.
     *
     * POST /api/login
     * Body: { email, password, device_name? }
     * 200: { user, token }
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', (string) $request->string('email'))->first();

        if (! $user || ! $user->password || ! Hash::check((string) $request->string('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $token = $user->createToken((string) $request->input('device_name', 'mobile'))->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * Return the currently authenticated user.
     *
     * GET /api/user  (auth:sanctum)
     * 200: { user }
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    /**
     * Revoke the token used to make the current request.
     *
     * POST /api/logout  (auth:sanctum)
     * 204
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }
}
