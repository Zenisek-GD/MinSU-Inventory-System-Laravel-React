<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('items', function (Blueprint $table) {
            if (!Schema::hasColumn('items', 'reorder_level')) {
                $table->integer('reorder_level')->default(0)->after('purchase_price');
            }
            if (!Schema::hasColumn('items', 'safety_stock')) {
                $table->integer('safety_stock')->default(0)->after('reorder_level');
            }
            if (!Schema::hasColumn('items', 'unit')) {
                $table->string('unit')->nullable()->after('safety_stock');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('items', function (Blueprint $table) {
            if (Schema::hasColumn('items', 'reorder_level')) {
                $table->dropColumn('reorder_level');
            }
            if (Schema::hasColumn('items', 'safety_stock')) {
                $table->dropColumn('safety_stock');
            }
            if (Schema::hasColumn('items', 'unit')) {
                $table->dropColumn('unit');
            }
        });
    }
};
