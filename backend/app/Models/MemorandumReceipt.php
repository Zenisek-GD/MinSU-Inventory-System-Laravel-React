<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class MemorandumReceipt extends Model
{
    use SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'mr_records';

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
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'mr_number',
        'entity_name',
        'fund_cluster',
        'office',
        'accountable_officer',
        'position',
        'date_issued',
        'received_from',
        'purpose',
        'status',
        'notes',
        'form_type',
        'created_by',
        'updated_by',
    ];

    /**
     * Form type constants
     */
    public const FORM_TYPE_ICS = 'ics'; // Inventory Custodian Slip (below 50k per unit)
    public const FORM_TYPE_PAR = 'par'; // Property Acknowledgment Receipt (50k+ per unit)
    public const PAR_THRESHOLD = 50000;

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'date_issued' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Available status values for MR workflow
     */
    public const STATUS_PENDING_REVIEW = 'Pending Review';
    public const STATUS_APPROVED = 'Approved';
    public const STATUS_RETURNED = 'Returned';
    public const STATUS_REJECTED = 'Rejected';
    public const STATUS_PROCESSING = 'Processing';
    public const STATUS_READY_FOR_RELEASE = 'Ready for Release';
    public const STATUS_OUT_FOR_DELIVERY = 'Out for Delivery';
    public const STATUS_FOR_RECEIVING = 'For Receiving';
    public const STATUS_COMPLETED = 'Completed';
    public const STATUS_ISSUE_REPORTED = 'Issue Reported';
    public const STATUS_CANCELLED = 'Cancelled';

    /**
     * Get the user who created this MR
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this MR
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get all items in this MR
     */
    public function items(): HasMany
    {
        return $this->hasMany(MRItem::class, 'mr_id');
    }

    /**
     * Get all signatures/approvals for this MR
     */
    public function signatures(): HasMany
    {
        return $this->hasMany(MRSignature::class, 'mr_id');
    }

    /**
     * Get all audit logs for this MR
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(MRAuditLog::class, 'mr_id')->orderBy('created_at', 'desc');
    }

    /**
     * Auto-generate MR number in format MR-YYYY-####
     * Uses database locking to prevent duplicate numbers
     */
    public static function generateMRNumber(): string
    {
        $year = date('Y');

        // Use database transaction with locking to prevent race conditions
        return DB::transaction(function () use ($year) {
            // Lock the table to prevent simultaneous number generation
            $latestMR = self::withTrashed()
                ->where('created_at', '>=', $year . '-01-01')
                ->lockForUpdate()  // Lock for exclusive update
                ->orderBy('id', 'desc')
                ->first();

            if (!$latestMR) {
                $counter = 1;
            } else {
                // Extract counter from last MR number (format: MR-YYYY-####)
                preg_match('/MR-\d{4}-(\d{4})/', $latestMR->mr_number, $matches);
                $counter = isset($matches[1]) ? (int) $matches[1] + 1 : 1;
            }

            // Ensure we don't exceed 9999
            if ($counter > 9999) {
                $counter = 9999;
            }

            return sprintf('MR-%d-%04d', $year, $counter);
        });
    }

    /**
     * Calculate total cost of all items in this MR
     */
    public function calculateTotalCost(): float
    {
        return $this->items()->sum(DB::raw('qty * unit_cost'));
    }

    /**
     * Get item count for this MR
     */
    public function getItemCount(): int
    {
        return $this->items()->count();
    }

    /**
     * Check if MR is editable (only in Draft status)
     */
    public function isEditable(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING_REVIEW, self::STATUS_RETURNED]);
    }

    public function isPendingReview(): bool
    {
        return $this->status === self::STATUS_PENDING_REVIEW;
    }

    public function isFinal(): bool
    {
        return in_array($this->status, [
            self::STATUS_COMPLETED,
            self::STATUS_REJECTED,
            self::STATUS_CANCELLED,
        ]);
    }

    /**
     * Get next required signatories
     * Returns array of roles that still need to sign
     */
    public function getNextSignatories(): array
    {
        return $this->signatures()
            ->where('status', 'Pending')
            ->pluck('role')
            ->toArray();
    }

    /**
     * Check if all required signatures are collected
     */
    public function allSignaturesCollected(): bool
    {
        return !$this->signatures()
            ->where('status', 'Pending')
            ->exists();
    }

    /**
     * Get all signed signatures
     */
    public function getSignedSignatures()
    {
        return $this->signatures()
            ->where('status', 'Signed')
            ->get();
    }

    /**
     * Transition MR status with validation
     */
    public function transitionStatus(string $newStatus, ?string $reason = null, ?User $user = null): bool
    {
        $validTransitions = [
            self::STATUS_PENDING_REVIEW => [self::STATUS_APPROVED, self::STATUS_REJECTED, self::STATUS_RETURNED, self::STATUS_CANCELLED],
            self::STATUS_RETURNED => [self::STATUS_PENDING_REVIEW, self::STATUS_CANCELLED], // Re-submit
            self::STATUS_APPROVED => [self::STATUS_PROCESSING, self::STATUS_CANCELLED, self::STATUS_READY_FOR_RELEASE],
            self::STATUS_PROCESSING => [self::STATUS_PROCESSING, self::STATUS_READY_FOR_RELEASE, self::STATUS_OUT_FOR_DELIVERY, self::STATUS_CANCELLED],
            self::STATUS_READY_FOR_RELEASE => [self::STATUS_FOR_RECEIVING, self::STATUS_COMPLETED],
            self::STATUS_OUT_FOR_DELIVERY => [self::STATUS_FOR_RECEIVING, self::STATUS_COMPLETED],
            self::STATUS_FOR_RECEIVING => [self::STATUS_COMPLETED, self::STATUS_ISSUE_REPORTED],
            self::STATUS_ISSUE_REPORTED => [self::STATUS_COMPLETED, self::STATUS_PROCESSING, self::STATUS_CANCELLED],
            self::STATUS_REJECTED => [self::STATUS_PENDING_REVIEW], // Can return to pending
            self::STATUS_COMPLETED => [], // Final state
            self::STATUS_CANCELLED => [], // Final state
        ];

        // Check if transition is valid
        if (
            !isset($validTransitions[$this->status]) ||
            !in_array($newStatus, $validTransitions[$this->status])
        ) {
            return false;
        }

        // Update status
        $this->status = $newStatus;
        $this->updated_by = $user?->id ?? auth()->id();
        $this->save();

        // Log the transition
        MRAuditLog::create([
            'mr_id' => $this->id,
            'user_id' => $user?->id ?? auth()->id(),
            'action' => 'status_changed',
            'field_name' => 'status',
            'old_value' => $this->getOriginal('status'),
            'new_value' => $newStatus,
            'description' => "Status changed from {$this->getOriginal('status')} to {$newStatus}" . ($reason ? " - {$reason}" : ''),
            'user_name' => $user?->name ?? auth()->user()?->name ?? 'System',
            'user_role' => $user?->role ?? auth()->user()?->role ?? null,
            'user_ip' => request()->ip(),
        ]);

        return true;
    }

    /**
     * Override save to auto-generate MR number and set updated_by
     */
    public static function boot(): void
    {
        parent::boot();

        // Auto-generate MR number before creating new record
        static::creating(function ($model) {
            if (empty($model->mr_number)) {
                $model->mr_number = self::generateMRNumber();
            }
            $model->created_by = auth()->id();
            $model->updated_by = auth()->id();
        });

        // Update updated_by on model update
        static::updating(function ($model) {
            $model->updated_by = auth()->id();
        });
    }

    /**
     * Scope: Filter by status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Filter by office
     */
    public function scopeByOffice($query, string $office)
    {
        return $query->where('office', $office);
    }

    /**
     * Scope: Filter by created user
     */
    public function scopeByCreatedUser($query, int $userId)
    {
        return $query->where('created_by', $userId);
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date_issued', [$startDate, $endDate]);
    }

    /**
     * Scope: Get active MRs (not in final state)
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [
            self::STATUS_COMPLETED,
            self::STATUS_REJECTED,
            self::STATUS_CANCELLED,
        ]);
    }

    /**
     * Get human-readable status label with styling
     */
    public function getStatusLabel(): array
    {
        $labels = [
            self::STATUS_PENDING_REVIEW => ['label' => 'Pending Review', 'color' => 'warning'],
            self::STATUS_RETURNED => ['label' => 'Returned', 'color' => 'error'],
            self::STATUS_APPROVED => ['label' => 'Approved', 'color' => 'info'],
            self::STATUS_PROCESSING => ['label' => 'Processing', 'color' => 'info'],
            self::STATUS_READY_FOR_RELEASE => ['label' => 'Ready for Release', 'color' => 'primary'],
            self::STATUS_OUT_FOR_DELIVERY => ['label' => 'Out for Delivery', 'color' => 'primary'],
            self::STATUS_FOR_RECEIVING => ['label' => 'For Receiving', 'color' => 'secondary'],
            self::STATUS_COMPLETED => ['label' => 'Completed', 'color' => 'success'],
            self::STATUS_ISSUE_REPORTED => ['label' => 'Issue Reported', 'color' => 'error'],
            self::STATUS_REJECTED => ['label' => 'Rejected', 'color' => 'error'],
            self::STATUS_CANCELLED => ['label' => 'Cancelled', 'color' => 'error'],
        ];

        return $labels[$this->status] ?? ['label' => 'Unknown', 'color' => 'grey'];
    }
}
