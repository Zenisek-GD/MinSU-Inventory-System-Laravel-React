<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MRItem extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'mr_items';

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
        'item_id',
        'item_name',
        'qty',
        'unit',
        'property_number',
        'acquisition_date',
        'unit_cost',
        'total_cost',
        'condition',
        'remarks',
        'estimated_useful_life',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'qty' => 'integer',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'acquisition_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Condition options for items
     */
    public const CONDITION_GOOD = 'Good';
    public const CONDITION_FAIR = 'Fair';
    public const CONDITION_POOR = 'Poor';
    public const CONDITION_DAMAGED = 'Damaged';
    public const CONDITION_NON_FUNCTIONAL = 'Non-functional';

    /**
     * Get the Memorandum Receipt that owns this item
     */
    public function memorandumReceipt(): BelongsTo
    {
        return $this->belongsTo(MemorandumReceipt::class, 'mr_id');
    }

    /**
     * Get the actual inventory item if tracked
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    /**
     * Calculate total cost (qty * unit_cost)
     * This is called before saving to ensure accuracy
     */
    public function calculateTotalCost(): float
    {
        return round($this->qty * $this->unit_cost, 2);
    }

    /**
     * Get condition color for UI display
     */
    public function getConditionColor(): string
    {
        return match ($this->condition) {
            self::CONDITION_GOOD => 'success',
            self::CONDITION_FAIR => 'warning',
            self::CONDITION_POOR => 'warning',
            self::CONDITION_DAMAGED => 'error',
            self::CONDITION_NON_FUNCTIONAL => 'error',
            default => 'grey',
        };
    }

    /**
     * Override save to auto-compute total_cost
     */
    public static function boot(): void
    {
        parent::boot();

        // Auto-compute total_cost before saving
        static::saving(function ($model) {
            $model->total_cost = $model->calculateTotalCost();
        });
    }

    /**
     * Scope: Filter by condition
     */
    public function scopeByCondition($query, string $condition)
    {
        return $query->where('condition', $condition);
    }

    /**
     * Scope: Filter by unit type
     */
    public function scopeByUnit($query, string $unit)
    {
        return $query->where('unit', $unit);
    }

    /**
     * Scope: Get items within MR
     */
    public function scopeInMR($query, int $mrId)
    {
        return $query->where('mr_id', $mrId);
    }

    /**
     * Check if item is in good condition
     */
    public function isInGoodCondition(): bool
    {
        return $this->condition === self::CONDITION_GOOD;
    }

    /**
     * Check if item needs maintenance or replacement
     */
    public function needsMaintenance(): bool
    {
        return in_array($this->condition, [
            self::CONDITION_POOR,
            self::CONDITION_DAMAGED,
            self::CONDITION_NON_FUNCTIONAL,
        ]);
    }

    /**
     * Get formatted total cost
     */
    public function getFormattedTotalCost(): string
    {
        return '₱' . number_format((float) $this->total_cost, 2);
    }

    /**
     * Get formatted unit cost
     */
    public function getFormattedUnitCost(): string
    {
        return '₱' . number_format((float) $this->unit_cost, 2);
    }
}
