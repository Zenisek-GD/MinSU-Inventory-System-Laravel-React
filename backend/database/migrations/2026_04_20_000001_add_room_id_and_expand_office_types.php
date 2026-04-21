<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('offices', function (Blueprint $table) {
            if (!Schema::hasColumn('offices', 'room_id')) {
                $table->string('room_id', 64)->nullable()->unique()->after('floor');
                $table->index('room_id');
            }

            if (!Schema::hasColumn('offices', 'year_level')) {
                $table->unsignedTinyInteger('year_level')->nullable()->after('room_id');
            }

            if (!Schema::hasColumn('offices', 'assigned_professor')) {
                $table->string('assigned_professor', 255)->nullable()->after('year_level');
            }
        });

        // Expand office "type" enum values to support more location types used in the UI.
        $driver = DB::connection()->getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE `offices` MODIFY `type` ENUM(
                'office',
                'classroom',
                'laboratory',
                'studio',
                'lecture_hall',
                'registrar',
                'business_center',
                'admin',
                'dean',
                'faculty',
                'department',
                'student_center',
                'counseling',
                'clinic',
                'library',
                'lounge',
                'storage',
                'conference',
                'cafeteria',
                'maintenance',
                'security',
                'other'
            ) NOT NULL DEFAULT 'office'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert enum (best-effort on MySQL/MariaDB only)
        $driver = DB::connection()->getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE `offices` MODIFY `type` ENUM('office','classroom','laboratory') NOT NULL DEFAULT 'office'");
        }

        Schema::table('offices', function (Blueprint $table) {
            if (Schema::hasColumn('offices', 'assigned_professor')) {
                $table->dropColumn('assigned_professor');
            }
            if (Schema::hasColumn('offices', 'year_level')) {
                $table->dropColumn('year_level');
            }
            if (Schema::hasColumn('offices', 'room_id')) {
                // Drop unique + index if present
                try {
                    $table->dropUnique(['room_id']);
                } catch (Throwable $e) {
                    // ignore
                }
                try {
                    $table->dropIndex(['room_id']);
                } catch (Throwable $e) {
                    // ignore
                }
                $table->dropColumn('room_id');
            }
        });
    }
};
