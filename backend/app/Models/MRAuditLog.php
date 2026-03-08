<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MRAuditLog extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'mr_audit_logs';

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
     * Only use created_at, no updated_at for audit logs
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'mr_id',
        'user_id',
        'action',
        'field_name',
        'old_value',
        'new_value',
        'description',
        'user_name',
        'user_role',
        'user_ip',
        'created_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Possible audit actions
     */
    public const ACTION_CREATED = 'created';
    public const ACTION_UPDATED = 'updated';
    public const ACTION_DELETED = 'deleted';
    public const ACTION_STATUS_CHANGED = 'status_changed';
    public const ACTION_SIGNATURE_COLLECTED = 'signature_collected';
    public const ACTION_SIGNATURE_REJECTED = 'signature_rejected';
    public const ACTION_ITEM_ADDED = 'item_added';
    public const ACTION_ITEM_REMOVED = 'item_removed';
    public const ACTION_EXPORTED = 'exported';

    /**
     * Get the Memorandum Receipt that this log entry refers to
     */
    public function memorandumReceipt(): BelongsTo
    {
        return $this->belongsTo(MemorandumReceipt::class, 'mr_id');
    }

    /**
     * Get the user who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Create an audit log entry
     */
    public static function logAction(
        int $mrId,
        string $action,
        string $description,
        ?string $fieldName = null,
        ?string $oldValue = null,
        ?string $newValue = null
    ): self {
        return self::create([
            'mr_id' => $mrId,
            'user_id' => auth()->id(),
            'action' => $action,
            'field_name' => $fieldName,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'description' => $description,
            'user_name' => auth()->user()?->name ?? 'System',
            'user_role' => auth()->user()?->role ?? null,
            'user_ip' => request()->ip(),
            'created_at' => now(),
        ]);
    }

    /**
     * Get action label for display
     */
    public function getActionLabel(): string
    {
        return match ($this->action) {
            self::ACTION_CREATED => 'Created',
            self::ACTION_UPDATED => 'Updated',
            self::ACTION_DELETED => 'Deleted',
            self::ACTION_STATUS_CHANGED => 'Status Changed',
            self::ACTION_SIGNATURE_COLLECTED => 'Signature Collected',
            self::ACTION_SIGNATURE_REJECTED => 'Signature Rejected',
            self::ACTION_ITEM_ADDED => 'Item Added',
            self::ACTION_ITEM_REMOVED => 'Item Removed',
            self::ACTION_EXPORTED => 'Exported',
            default => ucfirst(str_replace('_', ' ', $this->action)),
        };
    }

    /**
     * Get action color for UI display
     */
    public function getActionColor(): string
    {
        return match ($this->action) {
            self::ACTION_CREATED => 'success',
            self::ACTION_UPDATED => 'info',
            self::ACTION_DELETED => 'error',
            self::ACTION_STATUS_CHANGED => 'warning',
            self::ACTION_SIGNATURE_COLLECTED => 'success',
            self::ACTION_SIGNATURE_REJECTED => 'error',
            self::ACTION_ITEM_ADDED => 'success',
            self::ACTION_ITEM_REMOVED => 'error',
            self::ACTION_EXPORTED => 'info',
            default => 'grey',
        };
    }

    /**
     * Scope: Filter by action
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope: Get logs for specific MR
     */
    public function scopeForMR($query, int $mrId)
    {
        return $query->where('mr_id', $mrId)->orderBy('created_at', 'desc');
    }

    /**
     * Scope: Get logs by user
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Get logs within date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope: Get recent logs
     */
    public function scopeRecent($query, int $limit = 50)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }
}
