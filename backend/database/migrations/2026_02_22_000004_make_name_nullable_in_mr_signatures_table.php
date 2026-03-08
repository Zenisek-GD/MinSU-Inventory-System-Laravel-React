<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * Make the name field nullable in mr_signatures table since we don't know the signer initially
     */
    public function up(): void
    {
        Schema::table('mr_signatures', function (Blueprint $table) {
            $table->string('name')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mr_signatures', function (Blueprint $table) {
            $table->string('name')->nullable(false)->change();
        });
    }
};
