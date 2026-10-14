<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'generator_id' => [
                'required',
                'integer',
                // Must be one of the organization's generators (shared fleet).
                Rule::exists('generators', 'id')->where('organization_id', $this->user()->organization_id),
            ],
            // Assignee must be a member of the same organization.
            'assignee_id' => [
                'nullable',
                'integer',
                Rule::exists('organization_user', 'user_id')->where('organization_id', $this->user()->current_organization_id),
            ],
            'due_date' => ['nullable', 'date'],
        ];
    }
}
