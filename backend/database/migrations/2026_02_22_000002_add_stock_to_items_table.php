<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // Add stock column if it doesn't exist
            if (!Schema::hasColumn('items', 'stock')) {
                $table->integer('stock')
                    ->default(1)
                    ->after('unit')
                    ->comment('Available stock quantity');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            if (Schema::hasColumn('items', 'stock')) {
                $table->dropColumn('stock');
            }
        });
    }
};
