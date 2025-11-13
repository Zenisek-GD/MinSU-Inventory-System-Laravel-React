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
        Schema::create('borrow_records', function (Blueprint $table) {
              $table->id();
            $table->foreignId('item_id')->constrained()->onDelete('cascade');
            $table->foreignId('borrowed_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->date('borrow_date');
            $table->date('expected_return_date');
            $table->date('actual_return_date')->nullable();
            $table->text('purpose')->nullable();
            $table->enum('condition_before', ['Excellent', 'Good', 'Fair', 'Needs Repair']);
            $table->enum('condition_after', ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Damaged'])->nullable();
            $table->enum('status', ['Pending', 'Approved', 'Rejected', 'Borrowed', 'Returned', 'Overdue', 'Lost'])->default('Pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrow_records');
    }
};
