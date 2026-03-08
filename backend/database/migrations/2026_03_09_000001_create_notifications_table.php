<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // notification type (mr_created, mr_approved, mr_rejected, etc)
            $table->string('title');
            $table->text('message');
            $table->string('related_model')->nullable(); // e.g., 'MemorandumReceipt'
            $table->unsignedBigInteger('related_id')->nullable(); // ID of the related model
            $table->string('action_link')->nullable(); // URL to navigate to
            $table->string('color')->default('info'); // success, warning, error, info
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // Indexes for faster queries
            $table->index('user_id');
            $table->index('type');
            $table->index('created_at');
            $table->index(['user_id', 'read_at']); // For finding unread notifications
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
