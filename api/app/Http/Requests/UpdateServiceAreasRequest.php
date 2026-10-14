<?php

namespace App\Http\Requests;

use App\Rules\UsState;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceAreasRequest extends FormRequest
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
            'service_states' => ['required', 'array', 'min:1'],
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
