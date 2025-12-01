<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequestItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'purchase_request_id',
        'item_id',
        'item_name',
        'description',
        'quantity',
        'quantity_received',
        'unit',
        'estimated_unit_price',
        'estimated_total_price',
        'urgency',
        'specifications',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'quantity_received' => 'decimal:2',
        'estimated_unit_price' => 'decimal:2',
        'estimated_total_price' => 'decimal:2',
        'urgency' => 'string',
    ];

    /**
     * Get the purchase request that owns the item.
     */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    /**
     * Get the inventory item this PR item is linked to (if received).
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Item::class);
    }

    /**
     * Calculate the estimated total price based on quantity and unit price.
     * This can be used as an accessor or called manually.
     */
    public function calculateTotalPrice(): void
    {
        $this->estimated_total_price = $this->quantity * $this->estimated_unit_price;
    }

    /**
     * Boot method to automatically calculate total price before saving.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            $model->calculateTotalPrice();
        });
    }

    /**
     * Scope a query to filter by urgency level.
     */
    public function scopeUrgency($query, $urgency)
    {
        return $query->where('urgency', $urgency);
    }

    /**
     * Scope a query to filter by purchase request.
     */
    public function scopeForPurchaseRequest($query, $purchaseRequestId)
    {
        return $query->where('purchase_request_id', $purchaseRequestId);
    }

    /**
     * Get the urgency levels available.
     */
    public static function getUrgencyLevels(): array
    {
        return [
            'Low' => 'Low',
            'Medium' => 'Medium',
            'High' => 'High',
            'Critical' => 'Critical',
        ];
    }
}