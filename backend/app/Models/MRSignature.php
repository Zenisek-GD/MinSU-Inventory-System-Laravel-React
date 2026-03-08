<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MRSignature extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'mr_signatures';

    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'id';

    /**
     * The "type" of the primary key ID.
     */
    protected $keyType = 'int';

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = true;

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = true;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'mr_id',
        'user_id',
        'role',
        'name',
        'position',
        'status',
        'signed_at',
        'reason_for_rejection',
        'signature_data',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'signed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Signature status values
     */
    public const STATUS_PENDING = 'Pending';
    public const STATUS_SIGNED = 'Signed';
    public const STATUS_REJECTED = 'Rejected';
    public const STATUS_CANCELLED = 'Cancelled';

    /**
     * Signature roles in approval order
     */
    public const ROLE_RECEIVER = 'Receiver';
    public const ROLE_DEPARTMENT_HEAD = 'Department Head';
    public const ROLE_PRINCIPAL = 'Principal';
    public const ROLE_FINANCE_OFFICER = 'Finance Officer';
    public const ROLE_DIRECTOR = 'Director';
    public const ROLE_SUPPLY_OFFICER = 'Supply Officer';

    /**
     * Get the Memorandum Receipt that owns this signature
     */
    public function memorandumReceipt(): BelongsTo
    {
        return $this->belongsTo(MemorandumReceipt::class, 'mr_id');
    }

    /**
     * Get the user who signed this
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Mark this signature as signed
     */
    public function markAsSigned(?string $signatureData = null): void
    {
        $this->status = self::STATUS_SIGNED;
        $this->signed_at = now();
        if ($signatureData) {
            $this->signature_data = $signatureData;
        }
        $this->reason_for_rejection = null; // Clear rejection reason
        $this->save();

        // Log the signature
        MRAuditLog::create([
            'mr_id' => $this->mr_id,
            'user_id' => auth()->id(),
            'action' => 'signature_collected',
            'field_name' => 'signature',
            'old_value' => 'Pending',
            'new_value' => 'Signed',
            'description' => "{$this->role} ({$this->name}) signed the MR",
            'user_name' => $this->name,
            'user_role' => $this->role,
            'user_ip' => request()->ip(),
        ]);
    }

    /**
     * Mark this signature as rejected
     */
    public function markAsRejected(string $reason): void
    {
        $this->status = self::STATUS_REJECTED;
        $this->reason_for_rejection = $reason;
        $this->save();

        // Log the rejection
        MRAuditLog::create([
            'mr_id' => $this->mr_id,
            'user_id' => auth()->id(),
            'action' => 'signature_rejected',
            'field_name' => 'signature',
            'old_value' => 'Pending',
            'new_value' => 'Rejected',
            'description' => "{$this->role} ({$this->name}) rejected the MR - Reason: {$reason}",
            'user_name' => $this->name,
            'user_role' => $this->role,
            'user_ip' => request()->ip(),
        ]);
    }

    /**
     * Check if this signature is pending
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if this signature has been signed
     */
    public function isSigned(): bool
    {
        return $this->status === self::STATUS_SIGNED;
    }

    /**
     * Check if this signature was rejected
     */
    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Get signature status color for UI display
     */
    public function getStatusColor(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'warning',
            self::STATUS_SIGNED => 'success',
            self::STATUS_REJECTED => 'error',
            self::STATUS_CANCELLED => 'error',
            default => 'grey',
        };
    }

    /**
     * Get signature role order (for sequential workflow)
     */
    public static function getRoleOrder(string $role): int
    {
        $order = [
            self::ROLE_RECEIVER => 1,
            self::ROLE_DEPARTMENT_HEAD => 2,
            self::ROLE_PRINCIPAL => 3,
            self::ROLE_FINANCE_OFFICER => 4,
            self::ROLE_DIRECTOR => 5,
            self::ROLE_SUPPLY_OFFICER => 6,
        ];

        return $order[$role] ?? 999;
    }

    /**
     * Get next role that needs to sign
     */
    public static function getNextRoleToSign(): ?string
    {
        // This would be determined by business logic
        // Usually sequential: Receiver -> Dept Head -> Principal
        return self::ROLE_RECEIVER;
    }

    /**
     * Scope: Filter by status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by role
     */
    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope: Get pending signatures
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope: Get signed signatures
     */
    public function scopeSigned($query)
    {
        return $query->where('status', self::STATUS_SIGNED);
    }

    /**
     * Scope: Get for specific MR
     */
    public function scopeForMR($query, int $mrId)
    {
        return $query->where('mr_id', $mrId);
    }

    /**
     * Check if all required signatories have signed
     */
    public function allSignaturesSigned(): bool
    {
        // Get the MR
        $mr = $this->memorandumReceipt;

        // Check if there are any pending signatures
        return !$mr->signatures()
            ->where('status', self::STATUS_PENDING)
            ->exists();
    }
}
