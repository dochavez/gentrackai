<?php

namespace App\Http\Requests;

use App\Models\GeneratorReading;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGeneratorReadingRequest extends FormRequest
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
            'metric' => ['required', Rule::in(GeneratorReading::METRICS)],
            'value' => [
                'required',
                'numeric',
                'min:0',
                $this->input('metric') === 'fuel' ? 'max:100' : 'max:999999',
            ],
            'note' => ['nullable', 'string', 'max:255'],
            'recorded_at' => ['nullable', 'date', 'before_or_equal:now'],
        ];
    }
}
