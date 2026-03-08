<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScannerScan extends Model
{
    protected $fillable = [
        'scanner_session_id',
        'qr_code',
        'notes',
        'processed',
    ];

    protected $casts = [
        'processed' => 'boolean',
    ];

    /**
     * Get the session this scan belongs to
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(ScannerSession::class, 'scanner_session_id');
    }
}
