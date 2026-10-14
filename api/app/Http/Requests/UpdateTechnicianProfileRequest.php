<?php

namespace App\Http\Requests;

use App\Rules\UsState;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTechnicianProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'business_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'logo' => ['nullable', 'image', 'max:8192'],
            'service_states' => ['sometimes', 'array', 'min:1'],
            'service_states.*' => ['string', 'size:2', new UsState],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_array($this->service_states)) {
            $this->merge([
                'service_states' => array_values(array_unique(array_map(
                    fn ($s) => strtoupper((string) $s),
                    $this->service_states,
                ))),
            ]);
        }
    }
}
