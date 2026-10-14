<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SendChatMessageRequest extends FormRequest
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
            // A turn needs text, an image, or both — but not nothing.
            'message' => ['nullable', 'string', 'max:2000', 'required_without:image'],
            // Content-based MIME check (mirrors the generator scan upload) so
            // HEIC/HEIF from iPhones is accepted, not silently rejected.
            'image' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/heic,image/heif', 'max:10240'],
        ];
    }
}
