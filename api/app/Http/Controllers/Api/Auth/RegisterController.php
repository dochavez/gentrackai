<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Teams;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;

class RegisterController extends Controller
{
    /**
     * Register a new email/password user and return an API token.
     *
     * POST /api/register
     * Body: { name, email, password, password_confirmation, device_name? }
     * 201: { user, token }
     */
    public function store(RegisterRequest $request, Teams $teams): JsonResponse
    {
        $user = User::create([
            'name' => (string) $request->string('name'),
            'email' => (string) $request->string('email'),
            'password' => (string) $request->string('password'),
            'provider' => 'email',
            'address_line1' => $request->input('address_line1'),
            'address_line2' => $request->input('address_line2'),
            'city' => $request->input('city'),
            'state' => $request->input('state'),
            'postal_code' => $request->input('postal_code'),
            'country' => $request->filled('country') ? $request->input('country') : 'US',
            'phone' => $request->input('phone'),
        ]);

        $teams->provisionForNewUser($user);

        event(new Registered($user));

        $token = $user->createToken((string) $request->input('device_name', 'mobile'))->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }
}
