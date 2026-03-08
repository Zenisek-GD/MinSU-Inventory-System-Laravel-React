<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds form_type (ICS/PAR) to mr_records table
     * and estimated_useful_life to mr_items table.
     */
    public function up(): void
    {
        // Add form_type to mr_records
        Schema::table('mr_records', function (Blueprint $table) {
            $table->enum('form_type', ['ics', 'par'])->default('ics')->after('notes')
                ->comment('ICS = Inventory Custodian Slip (below 50k), PAR = Property Acknowledgment Receipt (50k+)');
        });

        // Add estimated_useful_life to mr_items
        Schema::table('mr_items', function (Blueprint $table) {
            $table->string('estimated_useful_life', 100)->nullable()->after('remarks')
                ->comment('Used for ICS form (e.g. "5 years")');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mr_records', function (Blueprint $table) {
            $table->dropColumn('form_type');
        });

        Schema::table('mr_items', function (Blueprint $table) {
            $table->dropColumn('estimated_useful_life');
        });
    }
};
