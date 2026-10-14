<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class GoogleLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The app performs the native Google flow and sends us the resulting
     * ID token (JWT) as `id_token`. We accept the `idToken` alias too, since
     * that is the property name on the Google SDK response object.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'id_token' => ['required', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('id_token') && $this->has('idToken')) {
            $this->merge(['id_token' => $this->input('idToken')]);
        }
    }
}
