<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaintenanceRequestRequest extends FormRequest
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
            // The generator being serviced must belong to the caller's org.
            'generator_id' => [
                'required',
                'integer',
                Rule::exists('generators', 'id')->where('organization_id', $this->user()->current_organization_id),
            ],
            'detail' => ['required', 'string', 'max:2000'],
        ];
    }
}
