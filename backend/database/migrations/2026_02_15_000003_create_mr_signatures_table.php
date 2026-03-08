<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Creates the mr_signatures table to track all signatures and approvals on MRs.
     * Follows the workflow: Receiver → Department Head → Principal (if needed)
     */
    public function up(): void
    {
        Schema::create('mr_signatures', function (Blueprint $table) {
            // Primary key
            $table->id();

            // Foreign key to mr_records
            $table->unsignedBigInteger('mr_id');
            $table->foreign('mr_id')
                ->references('id')
                ->on('mr_records')
                ->onDelete('cascade')
                ->comment('Reference to the parent MR record');

            // Foreign key to users (who signed)
            $table->unsignedBigInteger('user_id')->nullable();
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null')
                ->comment('User who provided the signature');

            // Signature metadata
            $table->enum('role', [
                'Receiver',
                'Department Head',
                'Principal',
                'Finance Officer',
                'Director',
                'Supply Officer'
            ])->comment('Role of the person signing');

            $table->string('name')->comment('Full name of signer (can differ from user if temporary)');
            $table->string('position')->nullable()->comment('Position/title of signer');

            // Signature status
            $table->enum('status', [
                'Pending',
                'Signed',
                'Rejected',
                'Cancelled'
            ])->default('Pending')->comment('Current signature status');

            // Signature timestamp and notes
            $table->dateTime('signed_at')->nullable()->comment('When the signature was applied');
            $table->text('reason_for_rejection')->nullable()->comment('Explanation if signature was rejected');

            // Digital signature (base64 encoded image or signature capture)
            $table->longText('signature_data')->nullable()->comment('Digital signature data (base64)');

            // Audit trail
            $table->timestamps();

            // Indexes
            $table->index('mr_id');
            $table->index('user_id');
            $table->index('role');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mr_signatures');
    }
};
