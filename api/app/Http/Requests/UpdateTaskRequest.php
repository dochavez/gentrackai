<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
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
            'title' => ['sometimes', 'string', 'max:255'],
            'done' => ['sometimes', 'boolean'],
            // Assignee must be a member of the task's organization.
            'assignee_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('organization_user', 'user_id')->where('organization_id', $this->route('task')?->organization_id),
            ],
            'due_date' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
