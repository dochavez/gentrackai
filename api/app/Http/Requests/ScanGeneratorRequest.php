<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ScanGeneratorRequest extends FormRequest
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
            // Content-based check (reads the file's real MIME, not its extension).
            // The `image` rule can't be used here: it hard-codes jpg/png/gif/bmp/webp
            // and silently rejects HEIC/HEIF — the default iPhone photo format.
            'image' => ['required', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/heic,image/heif', 'max:10240'],
        ];
    }
}
