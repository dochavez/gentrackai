<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class AppleLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The app performs the native Sign in with Apple flow and sends us the
     * resulting `identityToken` (JWT). Apple only reveals the user's full name
     * on the *first* authorization and never puts it in the token, so the app
     * forwards it as `name`; we use it only when creating the account. Email is
     * read from the token, never from the client. `authorization_code` is the
     * one-time code we exchange for a refresh token so the Apple grant can be
     * revoked on account deletion (guideline 5.1.1(v)).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'identity_token' => ['required', 'string'],
            'authorization_code' => ['nullable', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('identity_token') && $this->has('identityToken')) {
            $this->merge(['identity_token' => $this->input('identityToken')]);
        }

        if (! $this->has('authorization_code') && $this->has('authorizationCode')) {
            $this->merge(['authorization_code' => $this->input('authorizationCode')]);
        }
    }
}
