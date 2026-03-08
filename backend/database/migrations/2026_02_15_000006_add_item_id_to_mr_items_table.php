<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Add item_id column to mr_items table to link MR items to actual inventory items
     * for tracking and accountability.
     */
    public function up(): void
    {
        Schema::table('mr_items', function (Blueprint $table) {
            // Add optional reference to actual inventory item for tracking
            $table->unsignedBigInteger('item_id')->nullable()->after('mr_id');
            $table->foreign('item_id')
                ->references('id')
                ->on('items')
                ->onDelete('set null')
                ->comment('Reference to actual inventory item for tracking');

            $table->index('item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mr_items', function (Blueprint $table) {
            $table->dropForeign(['item_id']);
            $table->dropIndex(['item_id']);
            $table->dropColumn('item_id');
        });
    }
};
