<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * Adds the notes column to mr_records table for additional comments/observations
     */
    public function up(): void
    {
        Schema::table('mr_records', function (Blueprint $table) {
            $table->text('notes')->nullable()->comment('Additional notes or observations');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mr_records', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
