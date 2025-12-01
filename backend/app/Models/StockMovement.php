<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    /**
     * Ledger system fields
     */
    protected $fillable = [
        'item_id',
        'type',           // purchase/transfer/adjustment/damage/disposal
        'quantity',       // positive or negative amount
        'from_office_id', // source location
        'to_office_id',   // destination location
        'performed_by',   // user who did this
        'reference_number', // PO, invoice, etc.
        'notes'          // additional details
    ];

    /**
     * Cast attributes to native types
     */
    protected $casts = [
        'quantity' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Movement type constants for easy reference
     */
    const TYPE_PURCHASE = 'purchase';
    const TYPE_TRANSFER = 'transfer';
    const TYPE_ADJUSTMENT = 'adjustment';
    const TYPE_DAMAGE = 'damage';
    const TYPE_DISPOSAL = 'disposal';

    /**
     * Get the item this movement belongs to
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Get the user who performed this movement
     */
    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Get the source office (where items came from)
     */
    public function fromOffice()
    {
        return $this->belongsTo(Office::class, 'from_office_id');
    }

    /**
     * Get the destination office (where items went)
     */
    public function toOffice()
    {
        return $this->belongsTo(Office::class, 'to_office_id');
    }

    /**
     * Scope: Get only incoming movements (purchases, positive adjustments)
     */
    public function scopeIncoming($query)
    {
        return $query->where('quantity', '>', 0);
    }

    /**
     * Scope: Get only outgoing movements (damages, disposals, negative adjustments)
     */
    public function scopeOutgoing($query)
    {
        return $query->where('quantity', '<', 0);
    }

    /**
     * Scope: Filter by movement type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope: Recent movements first
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
}
