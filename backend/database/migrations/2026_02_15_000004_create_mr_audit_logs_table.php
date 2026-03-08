<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Creates the mr_audit_logs table to track all changes made to MR records.
     * Provides complete audit trail for compliance and traceability.
     */
    public function up(): void
    {
        Schema::create('mr_audit_logs', function (Blueprint $table) {
            // Primary key
            $table->id();

            // Foreign key to mr_records
            $table->unsignedBigInteger('mr_id');
            $table->foreign('mr_id')
                ->references('id')
                ->on('mr_records')
                ->onDelete('cascade');

            // Foreign key to users (who made the change)
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            // Change details
            $table->string('action')->comment('Action performed: created, updated, deleted, status_changed');
            $table->string('field_name')->nullable()->comment('Field that was changed');
            $table->text('old_value')->nullable()->comment('Previous value (JSON for complex data)');
            $table->text('new_value')->nullable()->comment('New value (JSON for complex data)');
            $table->text('description')->nullable()->comment('Human-readable description of the change');

            // User information at time of change
            $table->string('user_name')->comment('Name of user who made the change');
            $table->string('user_role')->nullable()->comment('Role of user at time of change');
            $table->string('user_ip')->nullable()->comment('IP address of change source');

            // Timestamp
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index('mr_id');
            $table->index('user_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mr_audit_logs');
    }
};
