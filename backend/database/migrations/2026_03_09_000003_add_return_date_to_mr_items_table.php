<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Add return_date to mr_items table for tracking when items are returned
     */
    public function up(): void
    {
        Schema::table('mr_items', function (Blueprint $table) {
            // Add return_date to track when an item was returned
            $table->date('return_date')->nullable()->after('condition')->comment('Date the item was returned');

            // Change condition enum to include the new condition values used in the system
            $table->enum('condition', [
                'Excellent',
                'Good',
                'Fair',
                'Needs Repair',
                'Damaged',
                'Disposed',
                'Poor',
                'Non-functional'
            ])->default('Good')->change();

            // Add estimated_useful_life if it doesn't exist
            if (!Schema::hasColumn('mr_items', 'estimated_useful_life')) {
                $table->string('estimated_useful_life')->nullable()->after('remarks')->comment('Expected useful life of the item');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mr_items', function (Blueprint $table) {
            $table->dropColumn('return_date');
            $table->dropColumn('estimated_useful_life');

            // Revert condition enum
            $table->enum('condition', [
                'Good',
                'Fair',
                'Poor',
                'Damaged',
                'Non-functional'
            ])->default('Good')->change();
        });
    }
};
