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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained()->onDelete('cascade');

            // Ledger system: type defines the nature of the movement
            $table->enum('type', ['purchase', 'transfer', 'adjustment', 'damage', 'disposal']);

            // Quantity: positive for additions, negative for reductions
            $table->decimal('quantity', 12, 2);

            // Office tracking: where items came from and where they went
            $table->foreignId('from_office_id')->nullable()->constrained('offices')->nullOnDelete();
            $table->foreignId('to_office_id')->nullable()->constrained('offices')->nullOnDelete();

            // User who performed this movement
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();

            // Reference information (PO number, invoice, etc.)
            $table->string('reference_number')->nullable();

            // Additional details
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index('item_id');
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('stock_movements');
    }
};
