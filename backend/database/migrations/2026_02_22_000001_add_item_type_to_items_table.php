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
            // Add item_type field to distinguish between equipment and consumable items
            // Equipment: One-time borrowing with property number tracking
            // Consumable: Bulk supplies that are used up (reams, pairs, bundles, etc.)
            $table->enum('item_type', ['equipment', 'consumable'])
                ->default('equipment')
                ->after('unit')
                ->comment('Item type: equipment (permanent) or consumable (bulk supplies)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('item_type');
        });
    }
};
