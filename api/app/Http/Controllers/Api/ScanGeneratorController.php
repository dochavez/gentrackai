<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ScanGeneratorRequest;
use App\Services\GeneratorLabelExtractor;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Prism\Prism\Exceptions\PrismException;
use Prism\Prism\Exceptions\PrismRateLimitedException;

class ScanGeneratorController extends Controller
{
    public function __construct(private readonly GeneratorLabelExtractor $extractor) {}

    /**
     * Identify a generator from a photo of its label via Gemini. Does not
     * persist anything — returns the extracted specs for the user to confirm.
     *
     * POST /api/generators/scan
     */
    public function __invoke(ScanGeneratorRequest $request): JsonResponse
    {
        try {
            $result = $this->extractor->extract($request->file('image'));
        } catch (PrismRateLimitedException $e) {
            report($e);

            return response()->json([
                'message' => 'The AI service is busy right now (rate limit). Please try again in a moment.',
            ], 429);
        } catch (ConnectionException $e) {
            report($e);

            return response()->json([
                'message' => 'The AI service took too long to respond. Please try again.',
            ], 504);
        } catch (PrismException $e) {
            report($e);

            return response()->json([
                'message' => "We couldn't analyze that photo right now. Please try again.",
            ], 503);
        }

        // Accept if the model flagged it a generator OR it actually read identifying
        // fields — this rescues clear labels the model is unsure how to classify.
        $readFields = collect(['model_number', 'serial_number', 'manufacturer', 'name'])
            ->contains(fn ($key) => filled($result[$key] ?? null));

        if (($result['is_generator'] ?? false) !== true && ! $readFields) {
            return response()->json([
                'message' => "We couldn't recognize a generator label in that photo. Try a clearer shot of the nameplate.",
            ], 422);
        }

        return response()->json(['result' => $result]);
    }
}
