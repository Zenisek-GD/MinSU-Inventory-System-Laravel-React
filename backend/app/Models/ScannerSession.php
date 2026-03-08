<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScannerSession extends Model
{
    protected $fillable = [
        'session_code',
        'created_by_user_id',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user who created this session
     */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Get all scans for this session
     */
    public function scans(): HasMany
    {
        return $this->hasMany(ScannerScan::class);
    }

    /**
     * Get unprocessed scans
     */
    public function unprocessedScans(): HasMany
    {
        return $this->scans()->where('processed', false);
    }

    /**
     * Check if session is still active
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expires_at->isFuture();
    }

    /**
     * Generate a random 6-8 character session code
     */
    public static function generateCode(): string
    {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $characters[rand(0, strlen($characters) - 1)];
        }
        return $code;
    }
}
