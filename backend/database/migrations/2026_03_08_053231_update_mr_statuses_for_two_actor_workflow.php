<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Alter ENUM to VARCHAR to support new arbitrary statuses
        DB::statement("ALTER TABLE mr_records MODIFY COLUMN status VARCHAR(255) DEFAULT 'Pending Review'");

        // Map old statuses to new 2-actor workflow statuses
        DB::table('mr_records')->where('status', 'Draft')->update(['status' => 'Pending Review']);
        DB::table('mr_records')->where('status', 'Pending Signature')->update(['status' => 'Pending Review']);
        // If it was previously approved, we'll put it in processing
        DB::table('mr_records')->where('status', 'Approved')->update(['status' => 'Processing']);
        // If it was already released/accepted by the user, mark it Completed
        DB::table('mr_records')->where('status', 'Released')->update(['status' => 'Completed']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse mapping (lossy, but best effort)
        DB::table('mr_records')->where('status', 'Pending Review')->update(['status' => 'Draft']);
        DB::table('mr_records')->where('status', 'Processing')->update(['status' => 'Approved']);
        DB::table('mr_records')->where('status', 'Completed')->update(['status' => 'Released']);

        // Revert back to ENUM
        DB::statement("ALTER TABLE mr_records MODIFY COLUMN status ENUM('Draft', 'Pending Signature', 'Approved', 'Released', 'Rejected', 'Cancelled') DEFAULT 'Draft'");
    }
};
