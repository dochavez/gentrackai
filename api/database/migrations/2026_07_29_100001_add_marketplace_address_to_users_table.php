<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Service address. `state` (USPS code) drives technician area matching;
            // the rest is presentation. All nullable — existing users have none yet.
            $table->string('address_line1')->nullable()->after('provider');
            $table->string('address_line2')->nullable()->after('address_line1');
            $table->string('city')->nullable()->after('address_line2');
            $table->string('state', 2)->nullable()->after('city')->index();
            $table->string('postal_code', 16)->nullable()->after('state');
            $table->string('country', 2)->default('US')->after('postal_code');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'address_line1',
                'address_line2',
                'city',
                'state',
                'postal_code',
                'country',
            ]);
        });
    }
};
