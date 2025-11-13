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
        Schema::create('purchase_requests', function (Blueprint $table) {
             $table->id();
            $table->string('pr_number')->unique();
            $table->foreignId('office_id')->constrained()->onDelete('cascade');
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->text('purpose')->nullable();
            $table->enum('status', ['Draft', 'Pending', 'Approved', 'Rejected', 'Ordered', 'Completed', 'Cancelled'])->default('Draft');
            $table->decimal('total_estimated_cost', 12, 2)->default(0.00);
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });


        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained()->onDelete('cascade');
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->integer('quantity')->default(1);
            $table->string('unit')->default('pcs');
            $table->decimal('estimated_unit_price', 10, 2)->default(0.00);
            $table->decimal('estimated_total_price', 10, 2)->default(0.00);
            $table->enum('urgency', ['Low', 'Medium', 'High', 'Critical'])->default('Medium');
            $table->text('specifications')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
        Schema::dropIfExists('purchase_requests');
    }
};
