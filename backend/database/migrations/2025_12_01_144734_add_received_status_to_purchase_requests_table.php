<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE purchase_requests MODIFY COLUMN status ENUM('Draft', 'Pending', 'Approved', 'Rejected', 'Ordered', 'Completed', 'Cancelled', 'Received') DEFAULT 'Draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE purchase_requests MODIFY COLUMN status ENUM('Draft', 'Pending', 'Approved', 'Rejected', 'Ordered', 'Completed', 'Cancelled') DEFAULT 'Draft'");
    }
};
