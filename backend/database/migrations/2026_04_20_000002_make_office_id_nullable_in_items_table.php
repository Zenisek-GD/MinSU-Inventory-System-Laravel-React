<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('items') || !Schema::hasColumn('items', 'office_id')) {
            return;
        }

        $driver = DB::connection()->getDriverName();

        // We use raw SQL to avoid requiring doctrine/dbal for `change()`.
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            // Drop existing FK then make column nullable and re-add FK with SET NULL.
            DB::statement('ALTER TABLE `items` DROP FOREIGN KEY `items_office_id_foreign`');
            DB::statement('ALTER TABLE `items` MODIFY `office_id` BIGINT UNSIGNED NULL');
            DB::statement('ALTER TABLE `items` ADD CONSTRAINT `items_office_id_foreign` FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON DELETE SET NULL');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('items') || !Schema::hasColumn('items', 'office_id')) {
            return;
        }

        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE `items` DROP FOREIGN KEY `items_office_id_foreign`');
            DB::statement('ALTER TABLE `items` MODIFY `office_id` BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE `items` ADD CONSTRAINT `items_office_id_foreign` FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON DELETE CASCADE');
        }
    }
};
