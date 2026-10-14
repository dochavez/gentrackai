<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Cached AI recommendations, one row per organization. `payload` is
     * regenerated (via Gemini) only when `input_digest` changes or it goes stale
     * — the app reads this cache, never Gemini directly. `organization_id` is
     * added by a later migration (once the organizations table exists).
     */
    public function up(): void
    {
        Schema::create('insights', function (Blueprint $table) {
            $table->id();
            $table->json('payload')->nullable();
            $table->string('input_digest')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->boolean('generating')->default(false);
            $table->string('model')->nullable();
            $table->unsignedInteger('prompt_tokens')->nullable();
            $table->unsignedInteger('completion_tokens')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('insights');
    }
};
