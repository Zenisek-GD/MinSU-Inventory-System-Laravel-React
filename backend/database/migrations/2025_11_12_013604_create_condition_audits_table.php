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
        Schema::create('condition_audits', function (Blueprint $table) {
             $table->id();
            $table->foreignId('item_id')->constrained()->onDelete('cascade');
            $table->foreignId('checked_by')->constrained('users')->onDelete('cascade');
            $table->year('audit_year');
            $table->enum('condition', ['Excellent', 'Good', 'Fair', 'Needs Repair', 'Damaged', 'Disposed']);
            $table->text('remarks')->nullable();
            $table->text('recommendations')->nullable();
            $table->date('next_audit_date')->nullable();
            $table->timestamps();

            $table->unique(['item_id', 'audit_year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('condition_audits');
    }
};
