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
            // Add fund_cluster column with enum values for various fund sources
            $table->enum('fund_cluster', [
                'General Trust Fund',
                'Special Trust Fund',
                'TEF Trust Fund',
                'MDS/RAF'
            ])->default('General Trust Fund')->after('category_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('fund_cluster');
        });
    }
};
