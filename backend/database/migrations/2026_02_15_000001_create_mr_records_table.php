<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * Creates the mr_records table to store Memorandum Receipt header information.
     * This is the main table that holds all MR metadata and workflow status.
     */
    public function up(): void
    {
        Schema::create('mr_records', function (Blueprint $table) {
            // Primary key
            $table->id();

            // MR Number - auto-generated format: MR-YYYY-####
            $table->string('mr_number')->unique();

            // Entity and organizational information
            $table->string('entity_name')->comment('Name of the entity/organization');
            $table->string('fund_cluster')->nullable()->comment('Fund cluster identifier');
            $table->string('office')->comment('Office or department name');

            // Accountable person details
            $table->string('accountable_officer')->comment('Name of the officer responsible');
            $table->string('position')->comment('Position/title of accountable officer');

            // Transaction details
            $table->dateTime('date_issued')->comment('Date MR was issued');
            $table->string('received_from')->comment('Source/supplier of items');
            $table->text('purpose')->nullable()->comment('Purpose of acquisition');

            // Workflow status: Draft, Pending Signature, Approved, Released
            $table->enum('status', [
                'Draft',
                'Pending Signature',
                'Approved',
                'Released',
                'Rejected',
                'Cancelled'
            ])->default('Draft')->comment('Current status in approval workflow');

            // Audit trail
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Foreign keys
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes for performance
            $table->index('mr_number');
            $table->index('status');
            $table->index('office');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mr_records');
    }
};
