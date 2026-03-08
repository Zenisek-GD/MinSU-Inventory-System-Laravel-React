<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Creates the mr_items table to store individual items on a Memorandum Receipt.
     * Each MR can have multiple items with their own details and costing.
     */
    public function up(): void
    {
        Schema::create('mr_items', function (Blueprint $table) {
            // Primary key
            $table->id();

            // Foreign key to mr_records
            $table->unsignedBigInteger('mr_id');
            $table->foreign('mr_id')
                ->references('id')
                ->on('mr_records')
                ->onDelete('cascade')
                ->comment('Reference to the parent MR record');

            // Item details
            $table->string('item_name')->comment('Description/name of the item');
            $table->unsignedInteger('qty')->comment('Quantity of items');
            $table->string('unit')->nullable()->comment('Unit of measurement (pcs, set, etc.)');

            // Property and acquisition information
            $table->string('property_number')->nullable()->unique()->comment('Asset tag or property number');
            $table->dateTime('acquisition_date')->nullable()->comment('Date item was acquired');

            // Costing information
            $table->decimal('unit_cost', 15, 2)->default(0)->comment('Cost per unit');
            $table->decimal('total_cost', 15, 2)->default(0)->comment('Auto-computed: qty × unit_cost');

            // Physical condition
            $table->enum('condition', [
                'Good',
                'Fair',
                'Poor',
                'Damaged',
                'Non-functional'
            ])->default('Good')->comment('Current condition of the item');

            // Additional information
            $table->text('remarks')->nullable()->comment('Additional notes or observations');

            // Audit trail
            $table->timestamps();

            // Indexes for performance
            $table->index('mr_id');
            $table->index('property_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mr_items');
    }
};
