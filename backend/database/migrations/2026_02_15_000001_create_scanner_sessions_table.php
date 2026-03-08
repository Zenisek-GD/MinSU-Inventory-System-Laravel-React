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
        Schema::create('scanner_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_code', 8)->unique(); // 6-8 digit code like ABC123
            $table->foreignId('created_by_user_id')->constrained('users')->onDelete('cascade');
            $table->string('status')->default('active'); // active, completed, expired
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->index('session_code');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scanner_sessions');
    }
};
