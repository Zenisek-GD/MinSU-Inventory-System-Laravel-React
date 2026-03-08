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
        Schema::create('scanner_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scanner_session_id')->constrained('scanner_sessions')->onDelete('cascade');
            $table->string('qr_code'); // The actual QR code data
            $table->text('notes')->nullable();
            $table->boolean('processed')->default(false); // Mark if desktop has processed the scan
            $table->timestamps();
            $table->index('scanner_session_id');
            $table->index('processed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scanner_scans');
    }
};
