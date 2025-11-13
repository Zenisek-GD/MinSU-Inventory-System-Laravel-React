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
        Schema::create('items', function (Blueprint $table) {
              $table->id();
            $table->string('name');
            $table->text('description')->nullable();
              $table->unsignedBigInteger('category_id');
            $table->string('qr_code')->unique();
            $table->string('serial_number')->nullable();
            $table->enum('condition', ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Damaged', 'Disposed'])->default('Good');
            $table->enum('status', ['Available', 'Borrowed', 'Under Maintenance', 'Lost', 'Disposed'])->default('Available');
            $table->foreignId('office_id')->constrained()->onDelete('cascade');
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 10, 2)->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
