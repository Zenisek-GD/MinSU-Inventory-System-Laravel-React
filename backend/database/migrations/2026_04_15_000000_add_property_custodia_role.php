<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add 'property_custodia' role to the users table enum
     */
    public function up(): void
    {
        // Get the current database driver
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'mysql') {
            // For MySQL, we need to modify the enum
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'supply_officer', 'property_custodia', 'staff') DEFAULT 'staff'");
        } elseif ($driver === 'postgresql') {
            // For PostgreSQL
            DB::statement("ALTER TYPE user_role_type ADD VALUE 'property_custodia'");
        } elseif ($driver === 'sqlite') {
            // SQLite doesn't support enums, but we can just let it be (it uses string check)
            // No migration needed for SQLite
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'mysql') {
            // Revert to original enum
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'supply_officer', 'staff') DEFAULT 'staff'");
        }
        // For PostgreSQL and SQLite, reverting enum values is complex/not supported, so we skip it
    }
};
